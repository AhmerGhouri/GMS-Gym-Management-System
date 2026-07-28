import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';

@ApiTags('Attendance')
@Controller('attendance')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  @ApiOperation({ summary: 'Get attendance logs with optional filters' })
  @ApiQuery({ name: 'memberId', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'take', required: false })
  getAttendanceLogs(
    @Query('memberId') memberId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('take') take?: string,
  ) {
    return this.attendanceService.getAttendanceLogs({
      memberId,
      from,
      to,
      take: take ? parseInt(take, 10) : undefined,
    });
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get 7-day attendance summary for charts' })
  getAttendanceSummary() {
    return this.attendanceService.getAttendanceSummary();
  }

  @Get('member/:memberId')
  @ApiOperation({ summary: 'Get attendance logs for a specific member' })
  getMemberAttendanceLogs(
    @Param('memberId') memberId: string,
    @Query('take') take?: string,
  ) {
    return this.attendanceService.getMemberAttendanceLogs(memberId, take ? parseInt(take, 10) : 50);
  }
}
