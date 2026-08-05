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

  async getDashboardStats() {
    await this.membershipsService.syncExpiredMemberships();
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const sevenDaysAgo = new Date(todayStart);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const activeMembershipWhere = {
      status: MembershipStatus.ACTIVE,
      startDate: { lte: now },
      endDate: { gte: now },
      member: { status: MemberStatus.ACTIVE },
    };

    const [totalMembers, activeMembers, expiredMembers, todayAttendance, activeMembershipsData, payments, recentMemberships, recentAttendance, recentMembers, recentlyExpiredMemberships, maleMembers, femaleMembers] = await Promise.all([
      this.prisma.member.count({ where: { status: { not: MemberStatus.DELETED } } }),
      this.prisma.member.count({
        where: { status: MemberStatus.ACTIVE },
      }),
      this.prisma.member.count({ where: { status: MemberStatus.INACTIVE } }),
      this.prisma.attendanceLog.count({ where: { checkIn: { gte: todayStart } } }),
      // The monthly total represents the value of memberships that are valid today.
      this.prisma.membership.findMany({
        where: activeMembershipWhere,
        include: { plan: true },
      }),
      this.prisma.payment.findMany({
        where: { paymentStatus: { not: PaymentStatus.REFUNDED } },
      }),
      // Membership assignment is the system's billing event. Use it for the revenue
      // overview so newly registered members appear without waiting for a later
      // payment-status update.
      this.prisma.membership.findMany({
        where: {
          startDate: { gte: sixMonthsAgo },
          status: { not: MembershipStatus.CANCELLED },
        },
        include: { plan: true },
      }),
      this.prisma.attendanceLog.findMany({ where: { checkIn: { gte: sevenDaysAgo } } }),
      this.prisma.member.findMany({ where: { createdAt: { gte: sixMonthsAgo } } }),
      this.prisma.membership.findMany({
        where: { status: MembershipStatus.EXPIRED, updatedAt: { gte: new Date(now.getFullYear(), now.getMonth() - 1, 1) } },
        select: { updatedAt: true },
      }),
      this.prisma.member.count({ where: { gender: Gender.MALE, status: { not: MemberStatus.DELETED } } }),
      this.prisma.member.count({ where: { gender: Gender.FEMALE, status: { not: MemberStatus.DELETED } } }),
    ]);

    const monthlyRevenue = activeMembershipsData.reduce(
      (acc, membership) =>
        acc +
        Number(membership.planPrice) +
        (membership.startDate >= monthStart ? Number(membership.admissionFee) : 0),
      0
    );

    const outstandingDues = payments.reduce((acc, pay) => acc + Number(pay.remainingDue), 0);
    const todayRevenue = payments
      .filter(
        (payment) =>
          payment.paidAt >= todayStart &&
          (payment.paymentStatus === PaymentStatus.PAID ||
            payment.paymentStatus === PaymentStatus.PARTIAL),
      )
      .reduce((total, payment) => total + Number(payment.paidAmount), 0);

    const revenueByMonth = new Map<string, number>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      revenueByMonth.set(monthStr, 0);
    }
    
    recentMemberships.forEach((membership) => {
      const monthStr = membership.startDate.toLocaleString('en-US', {
        month: 'short',
        year: 'numeric',
      });
      if (revenueByMonth.has(monthStr)) {
        revenueByMonth.set(
          monthStr,
          revenueByMonth.get(monthStr)! +
            Number(membership.planPrice) +
            Number(membership.admissionFee),
        );
      }
    });
    
    const revenueTrend = Array.from(revenueByMonth.entries()).map(([month, revenue]) => ({
      month,
      revenue,
    }));

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

    const attendancePattern = Array.from(attendanceByDay.entries())
      .map(([date, count]) => ({ date, count }));

    // Get membership distribution
    const planCounts = new Map<string, number>();
    activeMembershipsData.forEach((ms) => {
      const name = ms.plan?.name || 'Unknown';
      planCounts.set(name, (planCounts.get(name) || 0) + 1);
    });

    const totalActive = activeMembershipsData.length;
    const membershipDistribution = Array.from(planCounts.entries())
      .map(([plan, count]) => ({
        plan,
        count,
        percentage: totalActive > 0 ? Math.round((count / totalActive) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const growthByMonth = new Map<string, number>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      growthByMonth.set(monthStr, 0);
    }

    recentMembers.forEach((m) => {
      const monthStr = m.createdAt.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      if (growthByMonth.has(monthStr)) {
        growthByMonth.set(monthStr, growthByMonth.get(monthStr)! + 1);
      }
    });

    // Accumulated total for the charts (not just new members that month, but total members that month)
    // To be perfectly accurate we would need to count members created before each month minus deletions, 
    // but for simplicity we will just do a running total from a base count.
    const baseCount = await this.prisma.member.count({
      where: { createdAt: { lt: sixMonthsAgo } },
    });

    const memberGrowth = [];
    let currentTotal = baseCount;
    const monthsArray = Array.from(growthByMonth.entries());
    
    for (const [month, count] of monthsArray) {
      currentTotal += count;
      memberGrowth.push({ month, members: currentTotal });
    }

    const currentMonthMembers = recentMembers.filter((member) => member.createdAt >= monthStart).length;
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthMembers = recentMembers.filter(
      (member) => member.createdAt >= previousMonthStart && member.createdAt < monthStart,
    ).length;
    const currentMonthRevenue = recentMemberships
      .filter((membership) => membership.startDate >= monthStart)
      .reduce((total, membership) => total + Number(membership.planPrice) + Number(membership.admissionFee), 0);
    const previousMonthRevenue = recentMemberships
      .filter((membership) => membership.startDate >= previousMonthStart && membership.startDate < monthStart)
      .reduce((total, membership) => total + Number(membership.planPrice) + Number(membership.admissionFee), 0);
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayAttendance = recentAttendance.filter(
      (attendance) => attendance.checkIn >= yesterdayStart && attendance.checkIn < todayStart,
    ).length;
    const currentMonthExpired = recentlyExpiredMemberships.filter(
      (membership) => membership.updatedAt >= monthStart,
    ).length;
    const previousMonthExpired = recentlyExpiredMemberships.filter(
      (membership) => membership.updatedAt >= previousMonthStart && membership.updatedAt < monthStart,
    ).length;
    const currentMonthDues = payments
      .filter((payment) => payment.createdAt >= monthStart)
      .reduce((total, payment) => total + Number(payment.remainingDue), 0);
    const previousMonthDues = payments
      .filter((payment) => payment.createdAt >= previousMonthStart && payment.createdAt < monthStart)
      .reduce((total, payment) => total + Number(payment.remainingDue), 0);
    const percentageChange = (current: number, previous: number) =>
      previous === 0 ? (current === 0 ? 0 : 100) : Math.round(((current - previous) / previous) * 100);

    return {
      totalMembers,
      activeMembers,
      expiredMembers,
      todayAttendance,
      todayRevenue,
      monthlyRevenue,
      outstandingDues,
      maleMembers,
      femaleMembers,
      // Chart data
      revenueTrend,
      attendancePattern,
      membershipDistribution,
      memberGrowth,
      changes: {
        totalMembers: percentageChange(currentMonthMembers, previousMonthMembers),
        activeMembers: percentageChange(currentMonthRevenue, previousMonthRevenue),
        expiredMembers: percentageChange(currentMonthExpired, previousMonthExpired),
        todayAttendance: percentageChange(todayAttendance, yesterdayAttendance),
        monthlyRevenue: percentageChange(currentMonthRevenue, previousMonthRevenue),
        outstandingDues: percentageChange(currentMonthDues, previousMonthDues),
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
      memberName: log.member ? `${log.member.firstName} ${log.member.lastName}` : 'Unknown',
      description: log.result === 'GRANTED' ? 'Checked in' : `Access denied — ${log.denyReason || 'Unknown'}`,
      timestamp: log.timestamp,
    }));
  }
}
