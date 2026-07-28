import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { CreateMemberDto, UpdateMemberDto, MemberFilterDto } from './dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { generateMemberId } from '@gms/utils';
import { Prisma } from '@prisma/client';

import { MembershipsService } from '../memberships/memberships.service';

@Injectable()
export class MembersService {
  private readonly logger = new Logger(MembersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly membershipsService: MembershipsService,
  ) {}

  async create(dto: CreateMemberDto) {
    if (dto.cnic) {
      const existingCnic = await this.prisma.member.findUnique({
        where: { cnic: dto.cnic },
      });
      if (existingCnic) {
        throw new ConflictException('Member with this CNIC already exists');
      }
    }

    // Generate Member ID (e.g., GMS-0001)
    const count = await this.prisma.member.count();
    const memberId = generateMemberId(count + 1);

    const { planId, joiningDate, includeAdmissionFee, ...memberData } = dto;

    const member = await this.prisma.member.create({
      data: {
        ...memberData,
        memberId,
        joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
        status: planId ? 'INACTIVE' : 'ACTIVE',
      },
    });

    if (planId) {
      await this.membershipsService.assignPlan(
        member.id,
        planId,
        joiningDate ? new Date(joiningDate) : new Date(),
        includeAdmissionFee,
      );
    }

    this.logger.log(`Created new member: ${member.memberId}`);
    return member;
  }

  async findAll(filter: MemberFilterDto) {
    await this.membershipsService.syncExpiredMemberships();
    const where: Prisma.MemberWhereInput = {};

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.gender) {
      where.gender = filter.gender;
    }

    if (filter.timeSlot) {
      where.timeSlot = filter.timeSlot;
    }

    if (filter.search) {
      where.OR = [
        { memberId: { contains: filter.search, mode: 'insensitive' } },
        { firstName: { contains: filter.search, mode: 'insensitive' } },
        { lastName: { contains: filter.search, mode: 'insensitive' } },
        { phone: { contains: filter.search } },
        { cnic: { contains: filter.search } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.member.count({ where }),
      this.prisma.member.findMany({
        where,
        skip: filter.skip,
        take: filter.take,
        orderBy: filter.sortBy
          ? { [filter.sortBy]: filter.sortOrder }
          : { createdAt: 'desc' },
        include: {
          memberships: {
            where: { status: 'ACTIVE', endDate: { gte: new Date() } },
            include: { plan: true },
            take: 1,
          },
        },
      }),
    ]);

    // Map active membership to root for easier frontend consumption
    const mappedItems = items.map((item) => {
      const { memberships, ...rest } = item;
      return {
        ...rest,
        activeMembership: memberships.length > 0 ? memberships[0] : null,
      };
    });

    return new PaginatedResult(
      mappedItems,
      total,
      filter.page ?? 1,
      filter.limit ?? 10,
    );
  }

  async findOne(id: string) {
    await this.membershipsService.syncExpiredMemberships();
    const member = await this.prisma.member.findUnique({
      where: { id },
      include: {
          memberships: {
            include: { plan: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!member) {
      throw new NotFoundException(`Member with ID ${id} not found`);
    }

    return member;
  }

  async update(id: string, dto: UpdateMemberDto) {
    // Check if member exists
    await this.findOne(id);

    if (dto.status === 'ACTIVE') {
      const unpaidPayments = await this.prisma.payment.count({
        where: {
          memberId: id,
          paymentStatus: { in: ['PENDING', 'PARTIAL'] },
          remainingDue: { gt: 0 },
        },
      });
      if (unpaidPayments > 0) {
        throw new BadRequestException(
          'This member has unpaid dues and cannot be activated until the payment is marked paid.',
        );
      }
    }

    if (dto.cnic) {
      const existingCnic = await this.prisma.member.findFirst({
        where: { cnic: dto.cnic, id: { not: id } },
      });
      if (existingCnic) {
        throw new ConflictException('Member with this CNIC already exists');
      }
    }

    const updateData: any = { ...dto };
    if (dto.dateOfBirth) {
      updateData.dateOfBirth = new Date(dto.dateOfBirth);
    }
    if (dto.joiningDate) {
      updateData.joiningDate = new Date(dto.joiningDate);
    }

    const updatedMember = await this.prisma.member.update({
      where: { id },
      data: updateData,
    });

    this.logger.log(`Updated member: ${updatedMember.memberId}`);
    return updatedMember;
  }

  async remove(id: string) {
    // Soft delete
    const member = await this.findOne(id);

    await this.prisma.member.update({
      where: { id },
      data: { status: 'DELETED' },
    });

    this.logger.log(`Soft deleted member: ${member.memberId}`);
    return { message: 'Member deleted successfully' };
  }
}
