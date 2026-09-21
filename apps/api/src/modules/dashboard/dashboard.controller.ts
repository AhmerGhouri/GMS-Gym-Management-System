import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard stats with optional month/year filter' })
  @ApiQuery({ name: 'month', required: false, type: Number, description: '1-12' })
  @ApiQuery({ name: 'year', required: false, type: Number, description: 'YYYY' })
  getStats(
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    return this.dashboardService.getDashboardStats(month, year);
  }

  @Get('recent-activity')
  @ApiOperation({ summary: 'Get recent activity' })
  getRecentActivity() {
    return this.dashboardService.getRecentActivity();
  }
}
