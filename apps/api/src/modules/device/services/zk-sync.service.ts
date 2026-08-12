import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { ZkAttendanceService } from './zk-attendance.service';
import { ZkUserService } from './zk-user.service';
import { ZkDeviceHealthService } from './zk-device-health.service';
import { memberIdToDeviceUserId } from '../utils/attendance-hash.util';
import type { SyncAction } from '@prisma/client';
import { DEVICE_CONSTANTS } from '../constants/index';

@Injectable()
export class ZkSyncService {
  private readonly logger = new Logger(ZkSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly attendance: ZkAttendanceService,
    private readonly user: ZkUserService,
    private readonly health: ZkDeviceHealthService,
  ) {}

  async syncAllDeviceAttendance(): Promise<void> {
    const devices = await this.prisma.device.findMany({
      where: { isActive: true, status: 'ONLINE' },
      select: { id: true },
    });
    for (const device of devices) {
      await this.attendance.scheduleSync(device.id);
    }
    this.logger.log(`Enqueued attendance sync for ${devices.length} device(s)`);
  }

  async syncDeviceAttendance(deviceId: string): Promise<void> {
    await this.attendance.scheduleSync(deviceId);
  }

  async checkDeviceHealth(deviceId: string) {
    return this.health.pingDevice(deviceId);
  }

  async processPendingSyncJobs(): Promise<void> {
    const jobs = await this.prisma.syncJob.findMany({
      where: { 
        status: 'PENDING',
        device: { status: 'ONLINE' }
      },
      take: DEVICE_CONSTANTS.SYNC_JOB_BATCH_SIZE,
      orderBy: { createdAt: 'asc' },
    });

    if (!jobs.length) return;
    this.logger.log(`Processing ${jobs.length} pending sync job(s)`);

    for (const job of jobs) {
      try {
        await this.prisma.syncJob.update({
          where: { id: job.id },
          data: { status: 'PROCESSING' },
        });
        await this.dispatchSyncJob(job.id, job.deviceId, job.action, job.memberId);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`Failed to dispatch sync job ${job.id}: ${message}`);

        const retryCount = job.retryCount + 1;
        const shouldRetry = retryCount < job.maxRetries;

        await this.prisma.syncJob.update({
          where: { id: job.id },
          data: {
            status: shouldRetry ? 'PENDING' : 'FAILED',
            retryCount,
            error: message,
          },
        });
      }
    }
  }

  private async dispatchSyncJob(
    syncJobId: string,
    deviceId: string,
    action: SyncAction,
    memberId: string | null,
  ): Promise<void> {
    if (!memberId && (action === 'ENABLE_USER' || action === 'DISABLE_USER')) {
      await this.prisma.syncJob.update({
        where: { id: syncJobId },
        data: { status: 'FAILED', error: 'No memberId provided' },
      });
      return;
    }

    if (memberId) {
      const member = await this.prisma.member.findUnique({
        where: { id: memberId },
        select: { memberId: true, firstName: true, lastName: true },
      });

      if (!member) {
        await this.prisma.syncJob.update({
          where: { id: syncJobId },
          data: { status: 'FAILED', error: 'Member not found' },
        });
        return;
      }

      const uid = memberIdToDeviceUserId(member.memberId);
      if (uid === null) {
        await this.prisma.syncJob.update({
          where: { id: syncJobId },
          data: { status: 'FAILED', error: 'Cannot derive device UID from memberId' },
        });
        return;
      }

      switch (action) {
        case 'ENABLE_USER':
        case 'CREATE_USER':
          await this.user.enqueueCreate(deviceId, {
            userId: uid,
            name: `${member.firstName} ${member.lastName || ''}`.trim(),
          }, syncJobId);
          break;

        case 'DISABLE_USER':
        case 'DELETE_USER':
          await this.user.enqueueDelete(deviceId, uid, syncJobId);
          break;

        case 'UPDATE_USER':
          await this.user.enqueueUpdate(deviceId, {
            userId: uid,
            name: `${member.firstName} ${member.lastName || ''}`.trim(),
          }, syncJobId);
          break;

        case 'DOWNLOAD_ATTENDANCE':
          await this.attendance.scheduleSync(deviceId);
          await this.prisma.syncJob.update({
            where: { id: syncJobId },
            data: { status: 'COMPLETED', completedAt: new Date() },
          });
          break;

        default:
          this.logger.warn(`Unknown sync action: ${action}`);
          await this.prisma.syncJob.update({
            where: { id: syncJobId },
            data: { status: 'FAILED', error: `Unknown action: ${action}` },
          });
      }
    }
  }
}