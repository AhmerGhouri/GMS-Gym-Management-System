import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { DatabaseModule } from './core/database/database.module';
import { AuthModule } from './core/auth/auth.module';
import { MembersModule } from './modules/members/members.module';
import { MembershipsModule } from './modules/memberships/memberships.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { DevicesModule } from './modules/devices/devices.module';
import { DeviceModule } from './modules/device/device.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { CronModule } from './modules/cron/cron.module';
import { SettingsModule } from './modules/settings/settings.module';
import { UsersModule } from './modules/users/users.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ActivitiesModule } from './modules/activities/activities.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Schedule module — registered once at root level
    ScheduleModule.forRoot(),

    // BullMQ — registered once at root level with Redis config
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
        },
      }),
    }),

    // Core
    DatabaseModule,

    // Feature modules
    NotificationsModule,
    AuthModule,
    MembersModule,
    MembershipsModule,
    ActivitiesModule,
    AttendanceModule,
    DevicesModule,     // Device CRUD API (controllers)
    DeviceModule,      // ZKTeco device communication (services, schedulers, workers)
    PaymentsModule,
    DashboardModule,
    CronModule,
    SettingsModule,
    UsersModule,
  ],
})
export class AppModule {}
