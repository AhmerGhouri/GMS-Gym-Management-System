import { Module } from '@nestjs/common';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { ZktecoModule } from '../../core/services/zkteco.module';

@Module({
  imports: [ZktecoModule],
  controllers: [DevicesController],
  providers: [DevicesService]
})
export class DevicesModule {}
