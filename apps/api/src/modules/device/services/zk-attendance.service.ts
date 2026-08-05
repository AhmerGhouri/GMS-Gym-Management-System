import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../../core/database/prisma.service';
import { ZkConnectionService } from './zk-connection.service';
import { DeviceLockService } from '../utils/device-lock.service';
import { isNoDataError } from '../utils/zk-error-classifier';
import { generateAttendanceHash, deviceUserIdToMemberId } from '../utils/attendance-hash.util';
import { DEVICE_CONSTANTS } from '../constants/index';
import type { DeviceRecord } from '../interfaces/index';
import type { ZkAttendanceRecord, AttendanceInsertRow } from '../interfaces/index';
import type { AttendanceJobData } from '../types/index';

/**
 * Handles all attendance-related device operations.
 *
 * Flow:
 *   Connect → Read attendance → (empty? return) → Save to DB → Commit → Clear device → Disconnect
 *
 * Key guarantees:
 *   - Never clears device attendance before a successful DB commit
 *   - Bulk insert with deduplication via `attendanceHash` unique constraint
 *   - Map-based member lookup — no N+1 queries
 *   - Distributed lock prevents concurrent syncs on the same device
 */
@Injectable()
export class ZkAttendanceService {
  private readonly logger = new Logger(ZkAttendanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly connection: ZkConnectionService,
    private readonly lock: DeviceLockService,
    @InjectQueue(DEVICE_CONSTANTS.QUEUE_ATTENDANCE)
    private readonly attendanceQueue: Queue<AttendanceJobData>,
  ) {}

  // ── Public API ──

  /** Enqueue an attendance sync job for a device (called by scheduler). */
  async scheduleSync(deviceId: string): Promise<void> {
    await this.attendanceQueue.add('sync', { deviceId }, {
      removeOnComplete: 100,
      removeOnFail: 200,
    });
  }

  /** Process a single device attendance sync (called by worker). */
  async processSync(data: AttendanceJobData): Promise<void> {
    const device = await this.prisma.device.findUnique({
      where: { id: data.deviceId },
    });

    if (!device) {
      this.logger.warn(`Device ${data.deviceId} not found, skipping sync`);
      return;
    }

    if (!device.isActive) {
      this.logger.debug(`Device "${device.name}" is inactive, skipping sync`);
      return;
    }

    const lockKey = `${DEVICE_CONSTANTS.LOCK_PREFIX}:${DEVICE_CONSTANTS.LOCK_SYNC}:${device.id}`;
    const release = await this.lock.tryAcquire(lockKey, DEVICE_CONSTANTS.LOCK_TTL_SYNC);

    if (!release) {
      this.logger.debug(`Sync already in progress for "${device.name}", skipping`);
      return;
    }

    const startTime = Date.now();

    try {
      await this.performSync(device as unknown as DeviceRecord);
      const durationMs = Date.now() - startTime;
      this.logger.log(`Attendance sync completed for "${device.name}" in ${durationMs}ms`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Attendance sync failed for "${device.name}": ${message}`);
    } finally {
      await release();
    }
  }

  // ── Private Implementation ──

  private async performSync(device: DeviceRecord): Promise<void> {
    // Step 1: Read attendance logs from device
    let rawLogs: ZkAttendanceRecord[];
    try {
      rawLogs = await this.connection.withConnection(device, async (zk) => {
        const result = await zk.getAttendances();
        return (result?.data ?? []) as ZkAttendanceRecord[];
      });
    } catch (error) {
      if (isNoDataError(error)) {
        this.logger.debug(`No attendance available on "${device.name}"`);
        return;
      }
      throw error;
    }

    if (!rawLogs.length) {
      this.logger.debug(`No attendance logs returned from "${device.name}"`);
      return;
    }

    this.logger.log(`Fetched ${rawLogs.length} attendance records from "${device.name}"`);

    // Step 2: Bulk lookup members by their device user IDs
    const memberIds = [...new Set(rawLogs.map((l) => deviceUserIdToMemberId(l.user_id)))];
    const members = await this.prisma.member.findMany({
      where: { memberId: { in: memberIds } },
      select: { id: true, memberId: true },
    });
    const memberMap = new Map(members.map((m) => [m.memberId, m.id]));

    // Step 3: Bulk check for existing attendance hashes (deduplication)
    const hashes = rawLogs.map((l) =>
      generateAttendanceHash(device.id, l.user_id, l.record_time),
    );
    const existing = await this.prisma.attendanceLog.findMany({
      where: { attendanceHash: { in: hashes } },
      select: { attendanceHash: true },
    });
    const existingSet = new Set(existing.map((e) => e.attendanceHash));

    // Step 4: Build insert rows — skip duplicates and unmatched members
    const toCreate: AttendanceInsertRow[] = [];
    let skippedDuplicates = 0;
    let skippedUnknownMembers = 0;

    for (const log of rawLogs) {
      const hash = generateAttendanceHash(device.id, log.user_id, log.record_time);

      if (existingSet.has(hash)) {
        skippedDuplicates++;
        continue;
      }

      const gmsId = deviceUserIdToMemberId(log.user_id);
      const dbMemberId = memberMap.get(gmsId);

      if (!dbMemberId) {
        skippedUnknownMembers++;
        continue;
      }

      toCreate.push({
        deviceId: device.id,
        memberId: dbMemberId,
        checkIn: new Date(log.record_time),
        attendanceHash: hash,
        source: 'DEVICE',
      });
    }

    if (skippedDuplicates > 0) {
      this.logger.debug(`Skipped ${skippedDuplicates} duplicate records`);
    }
    if (skippedUnknownMembers > 0) {
      this.logger.warn(`Skipped ${skippedUnknownMembers} records with unrecognized member IDs`);
    }

    // Step 5: Transactional bulk insert
    if (toCreate.length > 0) {
      await this.prisma.$transaction(async (tx) => {
        await tx.attendanceLog.createMany({
          data: toCreate,
          skipDuplicates: true, // extra safety net for race conditions
        });
      });
      this.logger.log(`Inserted ${toCreate.length} new attendance records for "${device.name}"`);
    } else {
      this.logger.debug(`All fetched logs were duplicates or unmatched for "${device.name}"`);
    }

    // Step 6: Clear device attendance ONLY after successful DB commit
    try {
      await this.connection.withConnection(device, async (zk) => {
        await zk.clearAttendanceLog();
      });
      this.logger.log(`Cleared attendance logs on device "${device.name}"`);
    } catch (clearError) {
      // Log but don't fail the sync — data is safely in DB
      const message = clearError instanceof Error ? clearError.message : String(clearError);
      this.logger.warn(`Failed to clear attendance on "${device.name}": ${message}. Data is safe in DB.`);
    }

    // Step 7: Update device sync timestamp
    await this.prisma.device.update({
      where: { id: device.id },
      data: {
        lastSyncAt: new Date(),
        status: 'ONLINE',
        lastSeen: new Date(),
      },
    });
  }
}