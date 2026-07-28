import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { SettingsService } from './settings.service';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}
  @Get() getAll() { return this.settings.getAll(); }
  @Get('slots') getSlots() { return this.settings.getSlots(); }
  @Put('slots') saveSlots(@Body() body: { slots: unknown[] }) { return this.settings.saveSlots(body.slots); }
  @Put() save(@Body() body: { key: string; value: unknown; group?: string }) { return this.settings.save(body.key, body.value, body.group); }
}
