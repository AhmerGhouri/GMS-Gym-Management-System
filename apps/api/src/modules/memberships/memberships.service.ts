import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MembershipStatus } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { CreatePlanDto, UpdatePlanDto, UpdateMembershipDto } from './dto';

@Injectable()
export class MembershipsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPlans() {
    return this.prisma.membershipPlan.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPlan(dto: CreatePlanDto) {
    return this.prisma.membershipPlan.create({
      data: dto,
    });
  }

  async updatePlan(id: string, dto: UpdatePlanDto) {
    return this.prisma.membershipPlan.update({
      where: { id },
      data: dto,
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
    includeAdmissionFee = false,
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

    return this.prisma.membership.create({
      data: {
        memberId,
        planId,
        planPrice: plan.price,
        admissionFee: includeAdmissionFee ? plan.admissionFee : 0,
        startDate,
        endDate,
        status: 'ACTIVE',
      },
    });
  }

  async updateMembership(id: string, dto: UpdateMembershipDto) {
    const data: any = { ...dto };
    if (dto.endDate) data.endDate = new Date(dto.endDate);
    if (dto.frozenAt) data.frozenAt = new Date(dto.frozenAt);
    if (dto.frozenUntil) data.frozenUntil = new Date(dto.frozenUntil);

    return this.prisma.membership.update({
      where: { id },
      data,
    });
  }

  async deleteMembership(id: string) {
    return this.prisma.membership.delete({
      where: { id },
    });
  }
}
