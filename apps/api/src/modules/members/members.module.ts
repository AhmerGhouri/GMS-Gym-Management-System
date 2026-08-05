import { Module } from '@nestjs/common';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';
import { MembershipsModule } from '../memberships/memberships.module';
import { DeviceModule } from '../device/device.module';

@Module({
  imports: [MembershipsModule, DeviceModule],
  controllers: [MembersController],
  providers: [MembersService],
  exports: [MembersService],
})
export class MembersModule {}
