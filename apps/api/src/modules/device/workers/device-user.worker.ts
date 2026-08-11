import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ZkUserService } from '../services/zk-user.service';
import { extractErrorMessage } from '../utils/zk-error-classifier';
import { DEVICE_CONSTANTS } from '../constants/index';
import type { UserJobData, UserJobName } from '../types/index';

@Processor(DEVICE_CONSTANTS.QUEUE_USER)
export class DeviceUserWorker extends WorkerHost {
  private readonly logger = new Logger(DeviceUserWorker.name);

  constructor(private readonly user: ZkUserService) {
    super();
  }

  async process(job: Job<UserJobData>): Promise<void> {
    const jobName = job.name as UserJobName;
    this.logger.debug(`Processing ${jobName} job ${job.id} for device ${job.data.deviceId}`);

    try {
      switch (jobName) {
        case 'createUser':
          await this.user.processCreate(job.data);
          break;
        case 'deleteUser':
          await this.user.processDelete(job.data);
          break;
        case 'updateUser':
          await this.user.processUpdate(job.data);
          break;
        default:
          this.logger.warn(`Unknown user job name: ${jobName}`);
      }
    } catch (error) {
      const message = extractErrorMessage(error);
      this.logger.error(`User job ${job.id} (${jobName}) failed: ${message}`);
      throw error;
    }
  }
}
