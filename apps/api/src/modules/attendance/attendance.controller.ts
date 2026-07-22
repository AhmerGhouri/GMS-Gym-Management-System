import { Controller, Get, UseGuards } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';

@ApiTags('Attendance')
@Controller('attendance')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  @ApiOperation({ summary: 'Get all attendance logs' })
  getAttendanceLogs() {
    return this.attendanceService.getAttendanceLogs();
  }
}
