import { Controller, Get, UseGuards } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';

@ApiTags('Devices')
@Controller('devices')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all devices' })
  getDevices() {
    return this.devicesService.getDevices();
  }

  @Get('access-logs')
  @ApiOperation({ summary: 'Get all access logs' })
  getAccessLogs() {
    return this.devicesService.getAccessLogs();
  }
}
