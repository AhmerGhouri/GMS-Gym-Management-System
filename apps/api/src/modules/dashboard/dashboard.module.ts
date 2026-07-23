import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { MembershipsModule } from '../memberships/memberships.module';

@Module({
  controllers: [DashboardController],
  imports: [MembershipsModule],
  providers: [DashboardService]
})
export class DashboardModule {}
