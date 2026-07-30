import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DevicesService } from './devices.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { DeviceConnectionType } from '@prisma/client';
import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean } from 'class-validator';

class CreateDeviceDto {
  @IsString()
  name: string;

  @IsString()
  ipAddress: string;

  @IsNumber()
  port: number;

  @IsEnum(DeviceConnectionType)
  connectionType: DeviceConnectionType;

  @IsOptional()
  @IsString()
  serialNumber?: string;
}

class UpdateDeviceDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsNumber()
  port?: number;

  @IsOptional()
  @IsEnum(DeviceConnectionType)
  connectionType?: DeviceConnectionType;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

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

  @Post()
  @ApiOperation({ summary: 'Add a new device' })
  createDevice(@Body() body: CreateDeviceDto) {
    return this.devicesService.createDevice(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a device' })
  updateDevice(@Param('id') id: string, @Body() body: UpdateDeviceDto) {
    return this.devicesService.updateDevice(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a device' })
  deleteDevice(@Param('id') id: string) {
    return this.devicesService.deleteDevice(id);
  }

  @Post(':id/test-connection')
  @ApiOperation({ summary: 'Test connection to a device' })
  testConnection(@Param('id') id: string) {
    return this.devicesService.testConnection(id);
  }

  @Post(':id/sync')
  @ApiOperation({ summary: 'Manually sync attendance logs from a device' })
  syncDevice(@Param('id') id: string) {
    return this.devicesService.syncDevice(id);
  }

  @Get('access-logs')
  @ApiOperation({ summary: 'Get all access logs' })
  getAccessLogs() {
    return this.devicesService.getAccessLogs();
  }
}
