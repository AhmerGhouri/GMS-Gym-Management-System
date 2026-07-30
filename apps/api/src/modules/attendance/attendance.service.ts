import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getAttendanceLogs(query?: { memberId?: string; from?: string; to?: string; take?: number }) {
    const where: any = {};
    if (query?.memberId) where.memberId = query.memberId;
    if (query?.from || query?.to) {
      where.checkIn = {};
      if (query.from) where.checkIn.gte = new Date(query.from);
      if (query.to) where.checkIn.lte = new Date(query.to);
    }

    return this.prisma.attendanceLog.findMany({
      where,
      include: {
        member: {
          select: {
            id: true,
            memberId: true,
            firstName: true,
            lastName: true,
            photoUrl: true,
          },
        },
        device: {
          select: { id: true, name: true },
        },
      },
      orderBy: { checkIn: 'desc' },
      take: query?.take ?? 200,
    });
  }

  async getMemberAttendanceLogs(memberId: string, take = 50) {
    return this.prisma.attendanceLog.findMany({
      where: { memberId },
      include: {
        device: { select: { id: true, name: true } },
      },
      orderBy: { checkIn: 'desc' },
      take,
    });
  }

  async getAttendanceSummary() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(todayStart);
    weekAgo.setDate(weekAgo.getDate() - 6);

    // Build a daily count for the past 7 days
    const logs = await this.prisma.attendanceLog.findMany({
      where: { checkIn: { gte: weekAgo } },
      select: { checkIn: true },
    });

    const dailyCounts: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekAgo);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      dailyCounts[key] = 0;
    }

    logs.forEach((log) => {
      const key = log.checkIn.toISOString().slice(0, 10);
      if (key in dailyCounts) dailyCounts[key]++;
    });

    const todayCount = await this.prisma.attendanceLog.count({
      where: { checkIn: { gte: todayStart } },
    });

    return {
      todayCount,
      last7Days: Object.entries(dailyCounts).map(([date, count]) => ({ date, count })),
    };
  }
}
