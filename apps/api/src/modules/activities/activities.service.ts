import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { CreateActivityDto, UpdateActivityDto } from './dto';

@Injectable()
export class ActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.activity.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
    });
    if (!activity) {
      throw new NotFoundException(`Activity with ID ${id} not found`);
    }
    return activity;
  }

  async create(dto: CreateActivityDto) {
    const existing = await this.prisma.activity.findUnique({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException('Activity with this name already exists');
    }

    return this.prisma.activity.create({
      data: dto,
    });
  }

  async update(id: string, dto: UpdateActivityDto) {
    await this.findOne(id); // verify exists

    if (dto.name) {
      const existing = await this.prisma.activity.findFirst({
        where: { name: dto.name, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException('Activity with this name already exists');
      }
    }

    return this.prisma.activity.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.activity.delete({
      where: { id },
    });
  }
}
