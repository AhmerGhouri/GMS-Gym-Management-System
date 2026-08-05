import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ZkDeviceHealthService } from '../services/zk-device-health.service';
import { DEVICE_CONSTANTS } from '../constants/index';
import type { HealthJobData } from '../types/index';

@Processor(DEVICE_CONSTANTS.QUEUE_HEALTH)
export class HealthWorker extends WorkerHost {
  private readonly logger = new Logger(HealthWorker.name);

  constructor(private readonly health: ZkDeviceHealthService) {
    super();
  }

  async process(job: Job<HealthJobData>): Promise<void> {
    this.logger.debug(`Processing health check job ${job.id} for device ${job.data.deviceId}`);
    try {
      await this.health.pingDevice(job.data.deviceId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Health job ${job.id} failed: ${message}`);
    }
  }
}
