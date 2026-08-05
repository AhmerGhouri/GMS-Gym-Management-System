import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MembershipStatus } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { CreatePlanDto, UpdatePlanDto, UpdateMembershipDto } from './dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MembershipsService {
  constructor(private readonly prisma: PrismaService, private readonly notifications: NotificationsService) {}

  async getPlans() {
    return this.prisma.membershipPlan.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPlan(dto: CreatePlanDto) {
    return this.prisma.membershipPlan.create({
      data: dto as any,
    });
  }

  async updatePlan(id: string, dto: UpdatePlanDto) {
    return this.prisma.membershipPlan.update({
      where: { id },
      data: dto as any,
    });
  }

  async deletePlan(id: string) {
    const membershipsCount = await this.prisma.membership.count({ where: { planId: id } });
    if (membershipsCount > 0) {
      await this.prisma.membershipPlan.update({
        where: { id },
        data: { isActive: false },
      });
      return {
        message: 'Plan has existing memberships and was archived instead of deleted.',
        archived: true,
      };
    }
    return this.prisma.membershipPlan.delete({
      where: { id },
    });
  }

  async getMemberships() {
    await this.syncExpiredMemberships();
    return this.prisma.membership.findMany({
      include: {
        plan: true,
        member: true,
        payments: { orderBy: { paidAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async syncExpiredMemberships() {
    const now = new Date();
    const overdueMemberships = await this.prisma.membership.findMany({
      where: { status: MembershipStatus.ACTIVE, endDate: { lt: now } },
    });

    for (const membership of overdueMemberships) {
      await this.prisma.$transaction(async (tx) => {
        await tx.membership.update({
          where: { id: membership.id },
          data: { status: MembershipStatus.EXPIRED },
        });
        const openInvoice = await tx.payment.findFirst({
          where: { membershipId: membership.id, paymentStatus: { in: ['PENDING', 'PARTIAL'] } },
        });
        if (!openInvoice) {
          const amount = membership.planPrice;
          await tx.payment.create({
            data: {
              invoiceNumber: `INV-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
              memberId: membership.memberId,
              membershipId: membership.id,
              amount,
              discount: 0,
              totalAmount: amount,
              paidAmount: 0,
              remainingDue: amount,
              paymentMethod: 'CASH',
              paymentStatus: 'PENDING',
              paidAt: now,
              notes: 'Membership renewal due',
            },
          });
        }
        const stillActive = await tx.membership.count({
          where: { memberId: membership.memberId, status: MembershipStatus.ACTIVE, endDate: { gte: now } },
        });
        if (stillActive === 0) {
          await tx.member.update({ where: { id: membership.memberId }, data: { status: 'INACTIVE' } });
        }
      });
    }
  }

  async assignPlan(
    memberId: string,
    planId: string,
    customStartDate?: Date,
    includeAdmissionFee: boolean = false,
    activityIds?: string[],
    manualAdmissionFee?: number,
  ) {
    const plan = await this.prisma.membershipPlan.findUnique({
      where: { id: planId },
    });
    if (!plan) throw new NotFoundException('Plan not found');
    const member = await this.prisma.member.findUnique({ where: { id: memberId } });
    if (!member) throw new NotFoundException('Member not found');
    if (plan.gender !== 'UNISEX' && plan.gender !== member.gender) {
      throw new BadRequestException(`This ${plan.gender.toLowerCase()} plan cannot be assigned to this member.`);
    }

    const startDate = customStartDate || new Date();
    const activeMembership = await this.prisma.membership.findFirst({
      where: {
        memberId,
        status: MembershipStatus.ACTIVE,
        endDate: { gte: startDate },
      },
    });
    if (activeMembership) {
      throw new BadRequestException(
        'This member already has an active membership. Expire or cancel it before assigning another plan.',
      );
    }

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.durationDays);

    // Calculate activities price
    let activitiesPrice = 0;
    const activitiesToAssign: string[] = [];
    if (activityIds && activityIds.length > 0) {
      const activities = await this.prisma.activity.findMany({
        where: { id: { in: activityIds }, isActive: true },
      });
      for (const activity of activities) {
        activitiesPrice += Number(activity.price);
        activitiesToAssign.push(activity.id);
      }
    }

    const membership = await this.prisma.$transaction(async (tx) => {
      const createdMembership = await tx.membership.create({
        data: {
          memberId,
          planId,
          planPrice: Number(plan.price) + activitiesPrice,
          admissionFee: manualAdmissionFee ?? (includeAdmissionFee ? plan.admissionFee : 0),
          startDate,
          endDate,
          status: 'INACTIVE',
          activities: {
            create: activitiesToAssign.map(id => ({ activityId: id }))
          }
        },
      });
      const admissionFee = manualAdmissionFee ?? (includeAdmissionFee ? Number(plan.admissionFee) : 0);
      const totalAmount = Number(plan.price) + activitiesPrice + admissionFee;
      await tx.payment.create({
        data: {
        invoiceNumber: `INV-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
        memberId,
          membershipId: createdMembership.id,
        amount: totalAmount,
        discount: 0,
        totalAmount,
        paidAmount: totalAmount,
        remainingDue: 0,
        paymentMethod: 'CASH',
        paymentStatus: 'PAID',
        notes: 'Initial membership payment paid at registration',
        },
      });
      await tx.membership.update({ where: { id: createdMembership.id }, data: { status: 'ACTIVE' } });
      await tx.member.update({ where: { id: memberId }, data: { status: 'ACTIVE' } });
      return createdMembership;
    });
    await this.notifications.notifyAdmins('Membership created', `${member.firstName} ${member.lastName} was assigned ${plan.name}. The initial payment was recorded as paid.`, 'PAYMENT_RECEIVED', memberId);
    return membership;
  }

  async updateMembership(id: string, dto: UpdateMembershipDto) {
    const membership = await this.prisma.membership.findUnique({ where: { id } });
    if (!membership) throw new NotFoundException('Membership not found');
    if (dto.status === MembershipStatus.ACTIVE) {
      const [otherActive, unpaid] = await Promise.all([
        this.prisma.membership.count({
          where: { memberId: membership.memberId, status: MembershipStatus.ACTIVE, id: { not: id } },
        }),
        this.prisma.payment.count({
          where: { membershipId: id, paymentStatus: { in: ['PENDING', 'PARTIAL'] }, remainingDue: { gt: 0 } },
        }),
      ]);
      if (otherActive > 0) throw new BadRequestException('This member already has another active membership.');
    }
    const data: any = { ...dto };
    if (dto.endDate) data.endDate = new Date(dto.endDate);
    if (dto.frozenAt) data.frozenAt = new Date(dto.frozenAt);
    if (dto.frozenUntil) data.frozenUntil = new Date(dto.frozenUntil);

    const updatedMembership = await this.prisma.membership.update({
      where: { id },
      data,
    });
    if (dto.status === MembershipStatus.ACTIVE) {
      await this.prisma.member.update({ where: { id: membership.memberId }, data: { status: 'ACTIVE' } });
    }
    if (dto.status === MembershipStatus.INACTIVE || dto.status === MembershipStatus.SUSPENDED || dto.status === MembershipStatus.CANCELLED) {
      await this.prisma.member.update({ where: { id: membership.memberId }, data: { status: 'INACTIVE' } });
    }
    return updatedMembership;
  }

  async deleteMembership(id: string) {
    return this.prisma.membership.delete({
      where: { id },
    });
  }
}
