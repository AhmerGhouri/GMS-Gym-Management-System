import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ExpirationService } from './expiration.service';
import { AttendanceSyncService } from './attendance-sync.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [ExpirationService, AttendanceSyncService],
})
export class CronModule {}
