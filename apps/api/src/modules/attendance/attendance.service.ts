import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class AttendanceService {
  async getAttendanceLogs() {
    return prisma.attendanceLog.findMany({
      include: {
        member: true,
      },
      orderBy: { checkIn: 'desc' },
      take: 100,
    });
  }
}
