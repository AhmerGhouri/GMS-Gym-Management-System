import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { DEVICE_CONSTANTS } from './constants/index';

// Services
import { ZkConnectionService } from './services/zk-connection.service';
import { ZkAttendanceService } from './services/zk-attendance.service';
import { ZkUserService } from './services/zk-user.service';
import { ZkDeviceHealthService } from './services/zk-device-health.service';
import { ZkSyncService } from './services/zk-sync.service';

// Schedulers
import { AttendanceSyncScheduler } from './scheduler/attendance-sync.scheduler';
import { HealthScheduler } from './scheduler/health.scheduler';
import { SyncJobScheduler } from './scheduler/sync-job.scheduler';

// Workers
import { AttendanceWorker } from './workers/attendance.worker';
import { DeviceUserWorker } from './workers/device-user.worker';
import { HealthWorker } from './workers/health.worker';

// Utilities
import { DeviceLockService } from './utils/device-lock.service';

// Controller
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule,
    BullModule.registerQueue(
      { name: DEVICE_CONSTANTS.QUEUE_ATTENDANCE },
      { name: DEVICE_CONSTANTS.QUEUE_USER },
      { name: DEVICE_CONSTANTS.QUEUE_HEALTH },
    ),
  ],
  controllers: [HealthController],
  providers: [
    ZkConnectionService,
    ZkAttendanceService,
    ZkUserService,
    ZkDeviceHealthService,
    ZkSyncService,
    AttendanceSyncScheduler,
    HealthScheduler,
    SyncJobScheduler,
    AttendanceWorker,
    DeviceUserWorker,
    HealthWorker,
    DeviceLockService,
  ],
  exports: [
    ZkConnectionService,
    ZkAttendanceService,
    ZkUserService,
    ZkDeviceHealthService,
    ZkSyncService,
  ],
})
export class DeviceModule {}