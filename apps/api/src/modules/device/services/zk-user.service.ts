import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../../core/database/prisma.service';
import { ZkConnectionService } from './zk-connection.service';
import { DeviceLockService } from '../utils/device-lock.service';
import { memberIdToDeviceUserId } from '../utils/attendance-hash.util';
import { extractErrorMessage } from '../utils/zk-error-classifier';
import { DEVICE_CONSTANTS } from '../constants/index';
import type { DeviceRecord } from '../interfaces/index';
import type { UserJobData, UserJobName } from '../types/index';
import type { CreateDeviceUserDto } from '../dto/create-device-user.dto';
import type { UpdateDeviceUserDto } from '../dto/update-device-user.dto';

/**
 * Manages user CRUD operations on ZKTeco biometric devices.
 *
 * All operations go through BullMQ:
 *   1. Caller enqueues a job (enqueueCreate / enqueueDelete / enqueueUpdate)
 *   2. Worker picks up the job and calls the process* method
 *   3. SyncJob table is updated with the result for audit trail
 *
 * When membership becomes active → enqueue ENABLE_USER (create on device)
 * When membership expires       → enqueue DISABLE_USER (delete from device)
 */
@Injectable()
export class ZkUserService {
  private readonly logger = new Logger(ZkUserService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly connection: ZkConnectionService,
    private readonly lock: DeviceLockService,
    @InjectQueue(DEVICE_CONSTANTS.QUEUE_USER)
    private readonly userQueue: Queue<UserJobData>,
  ) {}

  // ── Queue Enqueue Methods (called by controllers / event listeners) ──

  /** Enqueue a user creation job for a specific device. */
  async enqueueCreate(deviceId: string, payload: CreateDeviceUserDto, syncJobId?: string): Promise<void> {
    await this.userQueue.add('createUser', { deviceId, payload, syncJobId }, {
      removeOnComplete: 100,
      removeOnFail: 200,
    });
    this.logger.debug(`Enqueued createUser for device ${deviceId}, user ${payload.userId}`);
  }

  /** Enqueue a user deletion job. */
  async enqueueDelete(deviceId: string, userId: number, syncJobId?: string): Promise<void> {
    await this.userQueue.add('deleteUser', { deviceId, payload: { userId }, syncJobId }, {
      removeOnComplete: 100,
      removeOnFail: 200,
    });
    this.logger.debug(`Enqueued deleteUser for device ${deviceId}, user ${userId}`);
  }

  /** Enqueue a user update job. */
  async enqueueUpdate(deviceId: string, payload: UpdateDeviceUserDto, syncJobId?: string): Promise<void> {
    await this.userQueue.add('updateUser', { deviceId, payload, syncJobId }, {
      removeOnComplete: 100,
      removeOnFail: 200,
    });
    this.logger.debug(`Enqueued updateUser for device ${deviceId}`);
  }

  /** Enqueue ENABLE_USER for all active devices (called on membership activation). */
  async enqueueEnableOnAllDevices(memberId: string, memberName: string): Promise<void> {
    const uid = memberIdToDeviceUserId(memberId);
    if (uid === null) {
      this.logger.warn(`Cannot derive device UID from memberId "${memberId}"`);
      return;
    }

    const devices = await this.prisma.device.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    for (const device of devices) {
      await this.enqueueCreate(device.id, {
        userId: uid,
        name: memberName,
      });
    }

    this.logger.log(`Enqueued ENABLE_USER on ${devices.length} device(s) for member ${memberId}`);
  }

  /** Enqueue DISABLE_USER for all active devices (called on membership expiration). */
  async enqueueDisableOnAllDevices(memberId: string): Promise<void> {
    const uid = memberIdToDeviceUserId(memberId);
    if (uid === null) {
      this.logger.warn(`Cannot derive device UID from memberId "${memberId}"`);
      return;
    }

    const devices = await this.prisma.device.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    for (const device of devices) {
      await this.enqueueDelete(device.id, uid);
    }

    this.logger.log(`Enqueued DISABLE_USER on ${devices.length} device(s) for member ${memberId}`);
  }

  // ── Worker Process Methods (called by BullMQ worker) ──

  /** Process a createUser job. */
  async processCreate(data: UserJobData): Promise<void> {
    const device = await this.getDeviceOrWarn(data.deviceId);
    if (!device) return;

    const payload = data.payload as CreateDeviceUserDto;
    const lockKey = `${DEVICE_CONSTANTS.LOCK_PREFIX}:${DEVICE_CONSTANTS.LOCK_USER}:${device.id}`;
    const release = await this.lock.tryAcquire(lockKey, DEVICE_CONSTANTS.LOCK_TTL_USER);

    if (!release) {
      this.logger.debug(`User operation lock held for "${device.name}", skipping`);
      return;
    }

    try {
      await this.connection.withConnection(device, async (zk) => {
        await zk.setUser(
          payload.userId,
          String(payload.userId),
          payload.name,
          payload.password ?? '',
          0,  // role: normal user
          0,  // cardno
        );
      });

      this.logger.log(`Created user ${payload.userId} ("${payload.name}") on device "${device.name}"`);
      await this.updateSyncJobStatus(data.syncJobId, 'COMPLETED');
    } catch (error) {
      const message = extractErrorMessage(error);
      this.logger.error(`Failed to create user ${payload.userId} on "${device.name}": ${message}`);
      await this.updateSyncJobStatus(data.syncJobId, 'FAILED', message);
      throw error; // Let BullMQ handle retry
    } finally {
      await release();
    }
  }

  /** Process a deleteUser job. */
  async processDelete(data: UserJobData): Promise<void> {
    const device = await this.getDeviceOrWarn(data.deviceId);
    if (!device) return;

    const payload = data.payload as { userId: number };
    const lockKey = `${DEVICE_CONSTANTS.LOCK_PREFIX}:${DEVICE_CONSTANTS.LOCK_USER}:${device.id}`;
    const release = await this.lock.tryAcquire(lockKey, DEVICE_CONSTANTS.LOCK_TTL_USER);

    if (!release) return;

    try {
      await this.connection.withConnection(device, async (zk) => {
        await zk.deleteUser(payload.userId);
      });

      this.logger.log(`Deleted user ${payload.userId} from device "${device.name}"`);
      await this.updateSyncJobStatus(data.syncJobId, 'COMPLETED');
    } catch (error) {
      const message = extractErrorMessage(error);
      this.logger.error(`Failed to delete user ${payload.userId} from "${device.name}": ${message}`);
      await this.updateSyncJobStatus(data.syncJobId, 'FAILED', message);
      throw error;
    } finally {
      await release();
    }
  }

  /** Process an updateUser job (delete + recreate). */
  async processUpdate(data: UserJobData): Promise<void> {
    const device = await this.getDeviceOrWarn(data.deviceId);
    if (!device) return;

    const payload = data.payload as UpdateDeviceUserDto;
    if (!payload.userId) {
      this.logger.warn('updateUser job missing userId');
      return;
    }

    const lockKey = `${DEVICE_CONSTANTS.LOCK_PREFIX}:${DEVICE_CONSTANTS.LOCK_USER}:${device.id}`;
    const release = await this.lock.tryAcquire(lockKey, DEVICE_CONSTANTS.LOCK_TTL_USER);

    if (!release) return;

    try {
      await this.connection.withConnection(device, async (zk) => {
        // ZKTeco K40 doesn't support in-place update — delete then recreate
        await zk.deleteUser(payload.userId!);
        await zk.setUser(
          payload.userId!,
          String(payload.userId),
          payload.name ?? '',
          payload.password ?? '',
          0,
          0,
        );
      });

      this.logger.log(`Updated user ${payload.userId} on device "${device.name}"`);
      await this.updateSyncJobStatus(data.syncJobId, 'COMPLETED');
    } catch (error) {
      const message = extractErrorMessage(error);
      this.logger.error(`Failed to update user ${payload.userId} on "${device.name}": ${message}`);
      await this.updateSyncJobStatus(data.syncJobId, 'FAILED', message);
      throw error;
    } finally {
      await release();
    }
  }

  /** Read all users from a device. */
  async getDeviceUsers(deviceId: string): Promise<unknown[]> {
    const device = await this.getDeviceOrWarn(deviceId);
    if (!device) return [];

    try {
      return await this.connection.withConnection(device, async (zk) => {
        const result = await zk.getUsers();
        return result?.data ?? [];
      });
    } catch (error) {
      const message = extractErrorMessage(error);
      this.logger.error(`Failed to read users from "${device.name}": ${message}`);
      return [];
    }
  }

  // ── Helpers ──

  private async getDeviceOrWarn(deviceId: string): Promise<DeviceRecord | null> {
    const device = await this.prisma.device.findUnique({ where: { id: deviceId } });
    if (!device) {
      this.logger.warn(`Device ${deviceId} not found`);
      return null;
    }
    if (!device.isActive) {
      this.logger.debug(`Device "${device.name}" is inactive`);
      return null;
    }
    return device as unknown as DeviceRecord;
  }

  private async updateSyncJobStatus(
    syncJobId: string | undefined,
    status: 'COMPLETED' | 'FAILED',
    error?: string,
  ): Promise<void> {
    if (!syncJobId) return;

    try {
      await this.prisma.syncJob.update({
        where: { id: syncJobId },
        data: {
          status,
          error: error ?? null,
          completedAt: status === 'COMPLETED' ? new Date() : undefined,
        },
      });
    } catch (dbErr) {
      const message = dbErr instanceof Error ? dbErr.message : String(dbErr);
      this.logger.warn(`Failed to update SyncJob ${syncJobId}: ${message}`);
    }
  }
}