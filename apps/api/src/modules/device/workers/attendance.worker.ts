import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ZkAttendanceService } from '../services/zk-attendance.service';
import { DEVICE_CONSTANTS } from '../constants/index';
import type { AttendanceJobData } from '../types/index';

@Processor(DEVICE_CONSTANTS.QUEUE_ATTENDANCE)
export class AttendanceWorker extends WorkerHost {
  private readonly logger = new Logger(AttendanceWorker.name);

  constructor(private readonly attendance: ZkAttendanceService) {
    super();
  }

  async process(job: Job<AttendanceJobData>): Promise<void> {
    this.logger.debug(`Processing attendance job ${job.id} for device ${job.data.deviceId}`);
    try {
      await this.attendance.processSync(job.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Attendance job ${job.id} failed: ${message}`);
      throw error;
    }
  }
}
