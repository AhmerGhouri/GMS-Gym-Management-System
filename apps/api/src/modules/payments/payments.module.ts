import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { DeviceModule } from '../device/device.module';

import { CronModule } from '../cron/cron.module';

@Module({
  imports: [DeviceModule, CronModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
