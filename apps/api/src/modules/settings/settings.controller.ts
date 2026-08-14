import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/auth/guards/roles.guard';
import { Roles } from '../../core/auth/decorators/roles.decorator';
import { Permissions } from '../../core/auth/decorators/permissions.decorator';
import { UserRole } from '@prisma/client';
import { SettingsService } from './settings.service';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}
  
  @Get() 
  @Permissions('settings.view')
  getAll() { return this.settings.getAll(); }
  
  @Get('slots') 
  @Permissions('settings.view')
  getSlots() { return this.settings.getSlots(); }
  
  @Put('slots') 
  @Permissions('settings.manage')
  saveSlots(@Body() body: { slots: unknown[] }) { return this.settings.saveSlots(body.slots); }
  
  @Put() 
  @Permissions('settings.manage')
  save(@Body() body: { key: string; value: unknown; group?: string }) { return this.settings.save(body.key, body.value, body.group); }
}
