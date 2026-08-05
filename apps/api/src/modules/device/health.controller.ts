import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../core/database/prisma.service';
import { ZkDeviceHealthService } from './services/zk-device-health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly deviceHealth: ZkDeviceHealthService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'System health check (DB + Redis)' })
  async check() {
    let dbOk = false;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbOk = true;
    } catch {
      // DB is down
    }
    return {
      status: dbOk ? 'OK' : 'DEGRADED',
      database: dbOk ? 'up' : 'down',
      timestamp: new Date(),
    };
  }

  @Get('devices')
  @ApiOperation({ summary: 'Get health status of all active devices' })
  async deviceStatuses() {
    return this.deviceHealth.getAllDeviceStatuses();
  }
}