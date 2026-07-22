import { Injectable } from '@nestjs/common';
import { PrismaClient, MemberStatus, MembershipStatus } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class DashboardService {
  async getDashboardStats() {
    const totalMembers = await prisma.member.count();
    const activeMembers = await prisma.member.count({
      where: { status: MemberStatus.ACTIVE },
    });
    const expiredMembers = await prisma.membership.count({
      where: { status: MembershipStatus.EXPIRED },
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayAttendance = await prisma.attendanceLog.count({
      where: { checkIn: { gte: todayStart } },
    });

    // Calculate expected monthly revenue based on active memberships
    const activeMembershipsData = await prisma.membership.findMany({
      where: { status: MembershipStatus.ACTIVE },
      include: { plan: true },
    });
    const monthlyRevenue = activeMembershipsData.reduce(
      (acc, ms) => acc + Number(ms.plan?.price || 0),
      0
    );

    const payments = await prisma.payment.findMany();
    const outstandingDues = payments.reduce((acc, pay) => acc + Number(pay.remainingDue), 0);

    // Get 6 months revenue trend
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const recentPayments = await prisma.payment.findMany({
      where: { paidAt: { gte: sixMonthsAgo } },
    });

    const revenueByMonth = new Map<string, number>();
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthStr = d.toLocaleString('en-US', { month: 'short' });
      revenueByMonth.set(monthStr, 0);
    }
    
    recentPayments.forEach((p) => {
      const monthStr = p.paidAt.toLocaleString('en-US', { month: 'short' });
      if (revenueByMonth.has(monthStr)) {
        revenueByMonth.set(monthStr, revenueByMonth.get(monthStr)! + Number(p.paidAmount));
      }
    });
    
    const revenueTrend = Array.from(revenueByMonth.entries())
      .map(([month, revenue]) => ({ month, revenue }))
      .reverse();

    // Get 7 days attendance pattern
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentAttendance = await prisma.attendanceLog.findMany({
      where: { checkIn: { gte: sevenDaysAgo } },
    });

    const attendanceByDay = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
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

    // Get member growth (last 6 months)
    const recentMembers = await prisma.member.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
    });

    const growthByMonth = new Map<string, number>();
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthStr = d.toLocaleString('en-US', { month: 'short' });
      growthByMonth.set(monthStr, 0);
    }

    recentMembers.forEach((m) => {
      const monthStr = m.createdAt.toLocaleString('en-US', { month: 'short' });
      if (growthByMonth.has(monthStr)) {
        growthByMonth.set(monthStr, growthByMonth.get(monthStr)! + 1);
      }
    });

    // Accumulated total for the charts (not just new members that month, but total members that month)
    // To be perfectly accurate we would need to count members created before each month minus deletions, 
    // but for simplicity we will just do a running total from a base count.
    const baseCount = await prisma.member.count({
      where: { createdAt: { lt: sixMonthsAgo } },
    });

    const memberGrowth = [];
    let currentTotal = baseCount;
    const monthsArray = Array.from(growthByMonth.entries()).reverse();
    
    for (const [month, count] of monthsArray) {
      currentTotal += count;
      memberGrowth.push({ month, members: currentTotal });
    }

    return {
      totalMembers,
      activeMembers,
      expiredMembers,
      todayAttendance,
      todayRevenue: 0, // Placeholder
      monthlyRevenue,
      outstandingDues,
      // Chart data
      revenueTrend,
      attendancePattern,
      membershipDistribution,
      memberGrowth,
    };
  }

  async getRecentActivity() {
    const accessLogs = await prisma.gateAccessLog.findMany({
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
