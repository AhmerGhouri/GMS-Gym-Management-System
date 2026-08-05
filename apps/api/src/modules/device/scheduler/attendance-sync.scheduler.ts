import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../../core/database/prisma.service';
import { ZkAttendanceService } from '../services/zk-attendance.service';
import { DeviceLockService } from '../utils/device-lock.service';
import { DEVICE_CONSTANTS } from '../constants/index';

@Injectable()
export class AttendanceSyncScheduler {
  private readonly logger = new Logger(AttendanceSyncScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly attendance: ZkAttendanceService,
    private readonly lock: DeviceLockService,
  ) {}

  @Cron(DEVICE_CONSTANTS.CRON_ATTENDANCE_SYNC)
  async trigger(): Promise<void> {
    const lockKey = `${DEVICE_CONSTANTS.LOCK_PREFIX}:${DEVICE_CONSTANTS.LOCK_SCHEDULER}:attendance-sync`;
    const release = await this.lock.tryAcquire(lockKey, DEVICE_CONSTANTS.LOCK_TTL_SCHEDULER);

    if (!release) {
      this.logger.debug('Attendance sync scheduler already running, skipping');
      return;
    }

    try {
      this.logger.log('Attendance sync cron triggered');
      const devices = await this.prisma.device.findMany({
        where: { isActive: true, status: 'ONLINE' },
        select: { id: true, name: true },
      });

      if (!devices.length) {
        this.logger.debug('No active/online devices to sync');
        return;
      }

      for (const device of devices) {
        await this.attendance.scheduleSync(device.id);
      }

      this.logger.log(`Enqueued attendance sync for ${devices.length} device(s)`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Attendance sync scheduler error: ${message}`);
    } finally {
      await release();
    }
  }
}