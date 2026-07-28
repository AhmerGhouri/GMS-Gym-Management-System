import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './core/database/database.module';
import { AuthModule } from './core/auth/auth.module';
import { MembersModule } from './modules/members/members.module';
import { MembershipsModule } from './modules/memberships/memberships.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { DevicesModule } from './modules/devices/devices.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { CronModule } from './modules/cron/cron.module';
import { SettingsModule } from './modules/settings/settings.module';
import { UsersModule } from './modules/users/users.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    NotificationsModule,
    AuthModule,
    MembersModule,
    MembershipsModule,
    AttendanceModule,
    DevicesModule,
    PaymentsModule,
    DashboardModule,
    CronModule,
    SettingsModule,
    UsersModule,
  ],
})
export class AppModule {}
