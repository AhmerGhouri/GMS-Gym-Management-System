import { Module } from '@nestjs/common';
import { ExpirationService } from './expiration.service';
import { DeviceModule } from '../device/device.module';

@Module({
  imports: [DeviceModule],
  providers: [ExpirationService],
})
export class CronModule {}
