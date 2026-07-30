import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../core/database/prisma.service';
import { ZktecoService } from '../../core/services/zkteco.service';

@Injectable()
export class AttendanceSyncService {
  private readonly logger = new Logger(AttendanceSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly zkteco: ZktecoService,
  ) { }


  @Cron('*/60 * * * *')
  async syncAttendanceLogs() {
    this.logger.log('Running periodic attendance sync...');
    const devices = await this.prisma.device.findMany({ where: { isActive: true } });

    for (const device of devices) {
      try {
        const logs = await this.zkteco.getAttendances(device.id);
        if (logs.length > 0) {
          this.logger.log(`Found ${logs.length} logs for device ${device.name}`);

          for (const log of logs) {
            // Reconstruct memberId (e.g. '1' -> 'GMS-0001')
            const reconstructedMemberId = `GMS-${String(log.user_id).padStart(4, '0')}`;
            const member = await this.prisma.member.findFirst({
              where: { memberId: reconstructedMemberId },
            });

            if (!member) {
              this.logger.warn(`Could not find member for device user_id: ${log.user_id}`);
            } else {
              // check if it exists in DB
              const existingLog = await this.prisma.attendanceLog.findFirst({
                where: {
                  memberId: member.id,
                  deviceId: device.id,
                  checkIn: new Date(log.record_time),
                }
              });

              if (!existingLog) {
                await this.prisma.attendanceLog.create({
                  data: {
                    memberId: member.id,
                    deviceId: device.id,
                    checkIn: new Date(log.record_time),
                  },
                });
              }
            }
          }
          // After successfully saving logs, clear them on the device
          await this.zkteco.clearAttendances(device.id);
        }

        // Update device status to ONLINE
        await this.prisma.device.update({
          where: { id: device.id },
          data: { status: 'ONLINE', lastSyncAt: new Date() },
        });
      } catch (error) {
        this.logger.error(`Failed to sync attendance for device ${device.id}: ${error}`);
        // Update device status to OFFLINE
        await this.prisma.device.update({
          where: { id: device.id },
          data: { status: 'OFFLINE' },
        });
      }
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async processSyncJobs() {
    const jobs = await this.prisma.syncJob.findMany({
      where: { status: 'PENDING' },
      take: 10,
    });

    for (const job of jobs) {
      try {
        if (!job.memberId) {
          await this.prisma.syncJob.update({ where: { id: job.id }, data: { status: 'FAILED', error: 'No memberId provided' } });
          continue;
        }
        // Find member
        const member = await this.prisma.member.findUnique({ where: { id: job.memberId } });
        if (!member) {
          await this.prisma.syncJob.update({ where: { id: job.id }, data: { status: 'FAILED', error: 'Member not found' } });
          continue;
        }

        const uid = parseInt(member.memberId.replace(/\D/g, ''), 10);
        if (isNaN(uid)) {
          await this.prisma.syncJob.update({ where: { id: job.id }, data: { status: 'FAILED', error: 'memberId must contain numbers to generate a valid device UID' } });
          continue;
        }

        let success = false;
        if (job.action === 'ENABLE_USER') {
          success = await this.zkteco.addUser(job.deviceId, uid, uid.toString(), `${member.firstName} ${member.lastName}`);
        } else if (job.action === 'DISABLE_USER') {
          success = await this.zkteco.deleteUser(job.deviceId, uid);
        }

        if (success) {
          await this.prisma.syncJob.update({ where: { id: job.id }, data: { status: 'COMPLETED' } });
        } else {
          await this.prisma.syncJob.update({ where: { id: job.id }, data: { status: 'FAILED', error: 'ZKTeco action failed' } });
        }
      } catch (error) {
        this.logger.error(`Failed to process sync job ${job.id}: ${error}`);
        await this.prisma.syncJob.update({ where: { id: job.id }, data: { status: 'FAILED', error: (error as Error).message } });
      }
    }
  }
}
