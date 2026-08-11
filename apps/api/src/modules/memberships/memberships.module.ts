import { Module } from '@nestjs/common';
import { MembershipsController } from './memberships.controller';
import { MembershipsService } from './memberships.service';
import { DeviceModule } from '../device/device.module';

@Module({
  imports: [DeviceModule],
  controllers: [MembershipsController],
  providers: [MembershipsService],
  exports: [MembershipsService]
})
export class MembershipsModule {}
