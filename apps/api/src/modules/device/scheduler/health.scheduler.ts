import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../../core/database/prisma.service';
import { DeviceLockService } from '../utils/device-lock.service';
import { DEVICE_CONSTANTS } from '../constants/index';
import type { HealthJobData } from '../types/index';

@Injectable()
export class HealthScheduler implements OnModuleInit {
  private readonly logger = new Logger(HealthScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly lock: DeviceLockService,
    @InjectQueue(DEVICE_CONSTANTS.QUEUE_HEALTH)
    private readonly healthQueue: Queue<HealthJobData>,
  ) {}

  async onModuleInit() {
    this.logger.log('Application started. Enqueuing one-time startup health check for all active devices.');
    try {
      const devices = await this.prisma.device.findMany({
        where: { isActive: true },
        select: { id: true },
      });

      for (const device of devices) {
        await this.healthQueue.add('ping', { deviceId: device.id }, {
          removeOnComplete: 50,
          removeOnFail: 100,
        });
      }
      this.logger.log(`Startup health check enqueued for ${devices.length} device(s)`);
    } catch (error) {
      this.logger.error(`Failed to enqueue startup health checks: ${error}`);
    }
  }

  @Cron(DEVICE_CONSTANTS.CRON_HEALTH_CHECK)
  async pingAll(): Promise<void> {
    const lockKey = `${DEVICE_CONSTANTS.LOCK_PREFIX}:${DEVICE_CONSTANTS.LOCK_SCHEDULER}:health`;
    const release = await this.lock.tryAcquire(lockKey, DEVICE_CONSTANTS.LOCK_TTL_SCHEDULER);

    if (!release) {
      this.logger.debug('Health scheduler already running, skipping');
      return;
    }

    try {
      const devices = await this.prisma.device.findMany({
        where: { isActive: true, status: 'ONLINE' },
        select: { id: true },
      });

      if (!devices.length) {
        this.logger.debug('No active devices for health check');
        return;
      }

      for (const device of devices) {
        await this.healthQueue.add('ping', { deviceId: device.id }, {
          removeOnComplete: 50,
          removeOnFail: 100,
        });
      }

      this.logger.debug(`Enqueued health check for ${devices.length} device(s)`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Health scheduler error: ${message}`);
    } finally {
      await release();
    }
  }
}
