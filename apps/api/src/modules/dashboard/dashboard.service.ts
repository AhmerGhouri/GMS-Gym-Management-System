import { Injectable } from '@nestjs/common';
import { Gender, MemberStatus, MembershipStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { MembershipsService } from '../memberships/memberships.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membershipsService: MembershipsService,
  ) {}

  async getDashboardStats(month?: number, year?: number) {
    await this.membershipsService.syncExpiredMemberships();
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayEnd = new Date(todayStart);
    yesterdayEnd.setMilliseconds(yesterdayEnd.getMilliseconds() - 1);

    // Determine target month and year
    const targetYear = year ? Number(year) : now.getFullYear();
    const targetMonthIndex = month ? Number(month) - 1 : now.getMonth();

    const targetMonthStart = new Date(targetYear, targetMonthIndex, 1, 0, 0, 0, 0);
    const targetMonthEnd = new Date(targetYear, targetMonthIndex + 1, 0, 23, 59, 59, 999);

    const prevMonthStart = new Date(targetYear, targetMonthIndex - 1, 1, 0, 0, 0, 0);
    const prevMonthEnd = new Date(targetYear, targetMonthIndex, 0, 23, 59, 59, 999);

    const sixMonthsAgo = new Date(targetYear, targetMonthIndex - 5, 1);
    const sevenDaysAgo = new Date(todayStart);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const [
      totalMembers,
      activeMembers,
      expiredMembers,
      maleMembers,
      femaleMembers,
      todayAttendance,
      yesterdayAttendance,
      monthlyAttendance,
      monthlyNewMembers,
      previousMonthNewMembers,
      monthlyExpiredMembers,
      previousMonthExpiredMembers,
      allPayments,
      monthlyPayments,
      prevMonthlyPayments,
      activeMembershipsData,
      recentAttendance,
      recentMemberships,
      recentMembers,
    ] = await Promise.all([
      // Total all-time non-deleted members
      this.prisma.member.count({ where: { status: { not: MemberStatus.DELETED } } }),
      // Currently active members
      this.prisma.member.count({ where: { status: MemberStatus.ACTIVE } }),
      // Expired/Inactive members
      this.prisma.member.count({ where: { status: MemberStatus.INACTIVE } }),
      // Male / Female all-time
      this.prisma.member.count({ where: { gender: Gender.MALE, status: { not: MemberStatus.DELETED } } }),
      this.prisma.member.count({ where: { gender: Gender.FEMALE, status: { not: MemberStatus.DELETED } } }),
      // Attendance
      this.prisma.attendanceLog.count({ where: { checkIn: { gte: todayStart, lte: todayEnd } } }),
      this.prisma.attendanceLog.count({ where: { checkIn: { gte: yesterdayStart, lte: yesterdayEnd } } }),
      this.prisma.attendanceLog.count({ where: { checkIn: { gte: targetMonthStart, lte: targetMonthEnd } } }),
      // New members in target month vs previous month
      this.prisma.member.count({
        where: {
          createdAt: { gte: targetMonthStart, lte: targetMonthEnd },
          status: { not: MemberStatus.DELETED },
        },
      }),
      this.prisma.member.count({
        where: {
          createdAt: { gte: prevMonthStart, lte: prevMonthEnd },
          status: { not: MemberStatus.DELETED },
        },
      }),
      // Expired members in target month vs previous month
      this.prisma.membership.count({
        where: {
          status: MembershipStatus.EXPIRED,
          endDate: { gte: targetMonthStart, lte: targetMonthEnd },
        },
      }),
      this.prisma.membership.count({
        where: {
          status: MembershipStatus.EXPIRED,
          endDate: { gte: prevMonthStart, lte: prevMonthEnd },
        },
      }),
      // Payments
      this.prisma.payment.findMany({
        where: { paymentStatus: { not: PaymentStatus.REFUNDED } },
      }),
      // Payments collected in target month
      this.prisma.payment.findMany({
        where: {
          paidAt: { gte: targetMonthStart, lte: targetMonthEnd },
          paymentStatus: { in: [PaymentStatus.PAID, PaymentStatus.PARTIAL] },
        },
      }),
      // Payments collected in previous month
      this.prisma.payment.findMany({
        where: {
          paidAt: { gte: prevMonthStart, lte: prevMonthEnd },
          paymentStatus: { in: [PaymentStatus.PAID, PaymentStatus.PARTIAL] },
        },
      }),
      // Active memberships for plan distribution
      this.prisma.membership.findMany({
        where: {
          status: MembershipStatus.ACTIVE,
          startDate: { lte: targetMonthEnd },
          endDate: { gte: targetMonthStart },
        },
        include: { plan: true },
      }),
      this.prisma.attendanceLog.findMany({ where: { checkIn: { gte: sevenDaysAgo } } }),
      this.prisma.membership.findMany({
        where: {
          startDate: { gte: sixMonthsAgo, lte: targetMonthEnd },
          status: { not: MembershipStatus.CANCELLED },
        },
        include: { plan: true },
      }),
      this.prisma.member.findMany({
        where: {
          createdAt: { gte: sixMonthsAgo, lte: targetMonthEnd },
          status: { not: MemberStatus.DELETED },
        },
      }),
    ]);

    // Financial calculations
    const monthlyRevenue = monthlyPayments.reduce((acc, pay) => acc + Number(pay.paidAmount), 0);
    const prevMonthRevenue = prevMonthlyPayments.reduce((acc, pay) => acc + Number(pay.paidAmount), 0);
    const totalRevenue = allPayments
      .filter((p) => p.paymentStatus === PaymentStatus.PAID || p.paymentStatus === PaymentStatus.PARTIAL)
      .reduce((acc, pay) => acc + Number(pay.paidAmount), 0);

    const totalOutstandingDues = allPayments.reduce((acc, pay) => acc + Number(pay.remainingDue), 0);
    const monthlyOutstandingDues = allPayments
      .filter((p) => p.createdAt >= targetMonthStart && p.createdAt <= targetMonthEnd)
      .reduce((acc, pay) => acc + Number(pay.remainingDue), 0);

    const todayRevenue = allPayments
      .filter(
        (p) =>
          p.paidAt >= todayStart &&
          p.paidAt <= todayEnd &&
          (p.paymentStatus === PaymentStatus.PAID || p.paymentStatus === PaymentStatus.PARTIAL),
      )
      .reduce((total, p) => total + Number(p.paidAmount), 0);

    // Revenue Trend for 6 months up to target month
    const revenueByMonth = new Map<string, number>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(targetYear, targetMonthIndex - i, 1);
      const monthStr = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      revenueByMonth.set(monthStr, 0);
    }

    allPayments
      .filter(
        (p) =>
          p.paidAt >= sixMonthsAgo &&
          p.paidAt <= targetMonthEnd &&
          (p.paymentStatus === PaymentStatus.PAID || p.paymentStatus === PaymentStatus.PARTIAL),
      )
      .forEach((pay) => {
        const monthStr = new Date(pay.paidAt).toLocaleString('en-US', { month: 'short', year: 'numeric' });
        if (revenueByMonth.has(monthStr)) {
          revenueByMonth.set(monthStr, revenueByMonth.get(monthStr)! + Number(pay.paidAmount));
        }
      });

    const revenueTrend = Array.from(revenueByMonth.entries()).map(([month, revenue]) => ({
      month,
      revenue,
    }));

    // Weekly attendance pattern
    const attendanceByDay = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayStart);
      d.setDate(todayStart.getDate() - i);
      const dayStr = d.toLocaleString('en-US', { weekday: 'short' });
      attendanceByDay.set(dayStr, 0);
    }

    recentAttendance.forEach((a) => {
      const dayStr = a.checkIn.toLocaleString('en-US', { weekday: 'short' });
      if (attendanceByDay.has(dayStr)) {
        attendanceByDay.set(dayStr, attendanceByDay.get(dayStr)! + 1);
      }
    });

    const attendancePattern = Array.from(attendanceByDay.entries()).map(([date, count]) => ({ date, count }));

    // Membership plan distribution
    const planCounts = new Map<string, number>();
    activeMembershipsData.forEach((ms) => {
      const name = ms.plan?.name || 'Unknown';
      planCounts.set(name, (planCounts.get(name) || 0) + 1);
    });

    const totalActiveInPeriod = activeMembershipsData.length;
    const membershipDistribution = Array.from(planCounts.entries())
      .map(([plan, count]) => ({
        plan,
        count,
        percentage: totalActiveInPeriod > 0 ? Math.round((count / totalActiveInPeriod) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Member Growth
    const growthByMonth = new Map<string, number>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(targetYear, targetMonthIndex - i, 1);
      const monthStr = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      growthByMonth.set(monthStr, 0);
    }

    recentMembers.forEach((m) => {
      const monthStr = m.createdAt.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      if (growthByMonth.has(monthStr)) {
        growthByMonth.set(monthStr, growthByMonth.get(monthStr)! + 1);
      }
    });

    const baseCount = await this.prisma.member.count({
      where: {
        createdAt: { lt: sixMonthsAgo },
        status: { not: MemberStatus.DELETED },
      },
    });

    const memberGrowth = [];
    let currentTotal = baseCount;
    for (const [month, count] of growthByMonth.entries()) {
      currentTotal += count;
      memberGrowth.push({ month, members: currentTotal });
    }

    const percentageChange = (current: number, previous: number) =>
      previous === 0 ? (current === 0 ? 0 : 100) : Math.round(((current - previous) / previous) * 100);

    return {
      // Monthly Specific Data (for current/selected month)
      monthlyRevenue,
      monthlyNewMembers,
      monthlyExpiredMembers,
      monthlyAttendance,
      monthlyOutstandingDues,
      // Daily
      todayAttendance,
      todayRevenue,
      // Overall All-Time Data (for reports page)
      totalRevenue,
      totalMembers,
      activeMembers,
      expiredMembers,
      totalOutstandingDues,
      maleMembers,
      femaleMembers,
      // Month Context
      selectedMonth: targetMonthIndex + 1,
      selectedYear: targetYear,
      selectedMonthLabel: targetMonthStart.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      isCurrentMonth: targetYear === now.getFullYear() && targetMonthIndex === now.getMonth(),
      // Chart data
      revenueTrend,
      attendancePattern,
      membershipDistribution,
      memberGrowth,
      // Comparisons
      changes: {
        monthlyNewMembers: percentageChange(monthlyNewMembers, previousMonthNewMembers),
        monthlyRevenue: percentageChange(monthlyRevenue, prevMonthRevenue),
        monthlyExpiredMembers: percentageChange(monthlyExpiredMembers, previousMonthExpiredMembers),
        todayAttendance: percentageChange(todayAttendance, yesterdayAttendance),
      },
    };
  }

  async getRecentActivity() {
    const accessLogs = await this.prisma.gateAccessLog.findMany({
      include: { member: true },
      orderBy: { timestamp: 'desc' },
      take: 6,
    });
    return accessLogs.map(log => ({
      id: log.id,
      type: log.result === 'GRANTED' ? 'check_in' : 'access_denied',
      memberName: log.member ? `${log.member.firstName} ${log.member.lastName || ''}`.trim() : 'Unknown',
      description: log.result === 'GRANTED' ? 'Checked in' : `Access denied — ${log.denyReason || 'Unknown'}`,
      timestamp: log.timestamp,
    }));
  }
}
