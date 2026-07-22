import { Injectable, NotFoundException } from '@nestjs/common';
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
    return this.prisma.membershipPlan.delete({
      where: { id },
    });
  }

  async getMemberships() {
    return this.prisma.membership.findMany({
      include: {
        plan: true,
        member: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async assignPlan(memberId: string, planId: string, customStartDate?: Date) {
    const plan = await this.prisma.membershipPlan.findUnique({
      where: { id: planId },
    });
    if (!plan) throw new NotFoundException('Plan not found');

    const startDate = customStartDate || new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.durationDays);

    return this.prisma.membership.create({
      data: {
        memberId,
        planId,
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
