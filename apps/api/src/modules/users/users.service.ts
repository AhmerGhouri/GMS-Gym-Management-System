import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}
  list() { return this.prisma.user.findMany({ select: { id: true, email: true, firstName: true, lastName: true, role: true, customRoleId: true, customRole: true, isActive: true, createdAt: true }, orderBy: { createdAt: 'desc' } }); }
  async get(id: string) { const user = await this.prisma.user.findUnique({ where: { id }, select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true } }); if (!user) throw new NotFoundException('User not found'); return user; }
  async create(data: { email: string; firstName: string; lastName: string; password: string; role: UserRole; customRoleId?: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new BadRequestException('A user with this email already exists');
    if (data.customRoleId) {
      const customRole = await this.prisma.customRole.findUnique({ where: { id: data.customRoleId } });
      if (!customRole) throw new BadRequestException('Custom role not found');
    }
    return this.prisma.user.create({ data: { ...data, password: await bcrypt.hash(data.password, 12) }, select: { id: true, email: true, firstName: true, lastName: true, role: true, customRoleId: true, customRole: true, isActive: true } });
  }
  async update(id: string, data: Partial<{ firstName: string; lastName: string; role: UserRole; customRoleId: string | null; isActive: boolean; password: string }>) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    const update: any = { ...data };
    if (data.customRoleId) {
      const customRole = await this.prisma.customRole.findUnique({ where: { id: data.customRoleId } });
      if (!customRole) throw new BadRequestException('Custom role not found');
    }
    if (data.password) update.password = await bcrypt.hash(data.password, 12);
    return this.prisma.user.update({ where: { id }, data: update, select: { id: true, email: true, firstName: true, lastName: true, role: true, customRoleId: true, customRole: true, isActive: true } });
  }
  async remove(id: string) { await this.prisma.user.delete({ where: { id } }); return { message: 'User deleted' }; }
  async bulkRemove(ids: string[]) { await this.prisma.user.deleteMany({ where: { id: { in: ids } } }); return { message: 'Users deleted' }; }
}
