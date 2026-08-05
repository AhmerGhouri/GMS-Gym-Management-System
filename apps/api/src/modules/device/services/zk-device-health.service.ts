import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { ZkConnectionService } from './zk-connection.service';
import { DeviceLockService } from '../utils/device-lock.service';
import { isNoDataError } from '../utils/zk-error-classifier';
import { DEVICE_CONSTANTS } from '../constants/index';
import type { DeviceRecord } from '../interfaces/index';
import type { DeviceHealthStatus } from '../interfaces/index';

/**
 * Device health monitoring service.
 */
@Injectable()
export class ZkDeviceHealthService {
  private readonly logger = new Logger(ZkDeviceHealthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly connection: ZkConnectionService,
    private readonly lock: DeviceLockService,
  ) {}

  async pingDevice(deviceId: string): Promise<DeviceHealthStatus | null> {
    const device = await this.prisma.device.findUnique({
      where: { id: deviceId },
    });

    if (!device) {
      this.logger.warn(`Device ${deviceId} not found`);
      return null;
    }

    if (!device.isActive) {
      return null;
    }

    const lockKey = `${DEVICE_CONSTANTS.LOCK_PREFIX}:${DEVICE_CONSTANTS.LOCK_HEALTH}:${device.id}`;
    const release = await this.lock.tryAcquire(lockKey, DEVICE_CONSTANTS.LOCK_TTL_HEALTH);

    if (!release) {
      this.logger.debug(`Health check lock held for "${device.name}", skipping`);
      return null;
    }

    const startTime = Date.now();

    try {
      await this.connection.withConnection(device as unknown as DeviceRecord, async (zk) => {
        await zk.getAttendances();
      });

      const responseTimeMs = Date.now() - startTime;
      const now = new Date();

      await this.prisma.device.update({
        where: { id: device.id },
        data: {
          status: 'ONLINE',
          lastSeen: now,
          responseTimeMs,
          lastError: null,
          failedAt: null,
        },
      });

      this.logger.debug(`Device "${device.name}" ONLINE (${responseTimeMs}ms)`);

      return {
        deviceId: device.id,
        deviceName: device.name,
        status: 'ONLINE' as const,
        responseTimeMs,
        lastSeen: now,
      };
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      const now = new Date();

      if (isNoDataError(error)) {
        await this.prisma.device.update({
          where: { id: device.id },
          data: {
            status: 'ONLINE',
            lastSeen: now,
            responseTimeMs,
            lastError: null,
            failedAt: null,
          },
        });

        this.logger.debug(`Device "${device.name}" ONLINE (no data response, ${responseTimeMs}ms)`);

        return {
          deviceId: device.id,
          deviceName: device.name,
          status: 'ONLINE' as const,
          responseTimeMs,
          lastSeen: now,
        };
      }

      const message = error instanceof Error ? error.message : String(error);

      await this.prisma.device.update({
        where: { id: device.id },
        data: {
          status: 'OFFLINE',
          lastSeen: now,
          lastError: message,
          failedAt: now,
        },
      });

      this.logger.warn(`Device "${device.name}" OFFLINE: ${message}`);

      return {
        deviceId: device.id,
        deviceName: device.name,
        status: 'OFFLINE' as const,
        responseTimeMs: null,
        lastSeen: now,
        error: message,
      };
    } finally {
      await release();
    }
  }

  async getAllDeviceStatuses(): Promise<DeviceHealthStatus[]> {
    const devices = await this.prisma.device.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        status: true,
        lastSeen: true,
        responseTimeMs: true,
      },
    });

    return devices.map((d) => ({
      deviceId: d.id,
      deviceName: d.name,
      status: d.status as 'ONLINE' | 'OFFLINE',
      responseTimeMs: d.responseTimeMs,
      lastSeen: d.lastSeen ?? new Date(),
    }));
  }
}