import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ZkSyncService } from '../services/zk-sync.service';
import { DeviceLockService } from '../utils/device-lock.service';
import { DEVICE_CONSTANTS } from '../constants/index';

@Injectable()
export class SyncJobScheduler {
  private readonly logger = new Logger(SyncJobScheduler.name);

  constructor(
    private readonly sync: ZkSyncService,
    private readonly lock: DeviceLockService,
  ) {}

  @Cron(DEVICE_CONSTANTS.CRON_SYNC_JOB)
  async processPending(): Promise<void> {
    const lockKey = `${DEVICE_CONSTANTS.LOCK_PREFIX}:${DEVICE_CONSTANTS.LOCK_SCHEDULER}:sync-jobs`;
    const release = await this.lock.tryAcquire(lockKey, DEVICE_CONSTANTS.LOCK_TTL_SCHEDULER);

    if (!release) {
      this.logger.debug('Sync job scheduler already running, skipping');
      return;
    }

    try {
      await this.sync.processPendingSyncJobs();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Sync job scheduler error: ${message}`);
    } finally {
      await release();
    }
  }
}