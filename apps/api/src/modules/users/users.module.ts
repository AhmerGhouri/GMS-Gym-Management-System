import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { RolesController } from './roles.controller';
import { DeviceModule } from '../device/device.module';

@Module({ 
  imports: [DeviceModule],
  controllers: [UsersController, RolesController], 
  providers: [UsersService] 
})
export class UsersModule {}
