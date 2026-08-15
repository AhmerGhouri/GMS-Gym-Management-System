import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { ZkUserService } from '../device/services/zk-user.service';

function uuidToDeviceUserId(uuid: string): number {
  let hash = 0;
  for (let i = 0; i < uuid.length; i++) {
    const char = uuid.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  // return (Math.abs(hash) % 100000) + 50000;
  return (Math.abs(hash) % 501) + 2500;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly zkUserService: ZkUserService,
  ) { }

  list() { return this.prisma.user.findMany({ select: { id: true, email: true, firstName: true, lastName: true, role: true, customRoleId: true, customRole: true, isActive: true, createdAt: true }, orderBy: { createdAt: 'desc' } }); }

  async get(id: string) { const user = await this.prisma.user.findUnique({ where: { id }, select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true } }); if (!user) throw new NotFoundException('User not found'); return user; }

  async create(data: { email: string; firstName: string; lastName: string; password: string; role: UserRole; customRoleId?: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new BadRequestException('A user with this email already exists');
    if (data.customRoleId) {
      const customRole = await this.prisma.customRole.findUnique({ where: { id: data.customRoleId } });
      if (!customRole) throw new BadRequestException('Custom role not found');
    }
    const user = await this.prisma.user.create({ data: { ...data, password: await bcrypt.hash(data.password, 12) }, select: { id: true, email: true, firstName: true, lastName: true, role: true, customRoleId: true, customRole: true, isActive: true } });

    // Sync to devices
    const uid = uuidToDeviceUserId(user.id);
    const devices = await this.prisma.device.findMany({ where: { isActive: true }, select: { id: true } });
    for (const device of devices) {
      await this.zkUserService.enqueueCreate(device.id, { userId: uid, name: `${user.firstName} ${user.lastName}`.trim().substring(0, 24) });
    }

    return user;
  }

  async update(id: string, data: Partial<{ firstName: string; lastName: string; role: UserRole; customRoleId: string | null; isActive: boolean; password: string }>) {
    const userToUpdate = await this.prisma.user.findUnique({ where: { id } });
    if (!userToUpdate) throw new NotFoundException('User not found');
    const update: any = { ...data };
    if (data.customRoleId) {
      const customRole = await this.prisma.customRole.findUnique({ where: { id: data.customRoleId } });
      if (!customRole) throw new BadRequestException('Custom role not found');
    }
    if (data.password) update.password = await bcrypt.hash(data.password, 12);

    const user = await this.prisma.user.update({ where: { id }, data: update, select: { id: true, email: true, firstName: true, lastName: true, role: true, customRoleId: true, customRole: true, isActive: true } });

    // Sync update to devices
    const uid = uuidToDeviceUserId(user.id);
    const devices = await this.prisma.device.findMany({ where: { isActive: true }, select: { id: true } });
    for (const device of devices) {
      if (user.isActive) {
        await this.zkUserService.enqueueUpdate(device.id, { userId: uid, name: `${user.firstName} ${user.lastName}`.trim().substring(0, 24) });
      } else {
        await this.zkUserService.enqueueDelete(device.id, uid);
      }
    }

    return user;
  }

  async remove(id: string) {
    await this.prisma.user.delete({ where: { id } });

    const uid = uuidToDeviceUserId(id);
    const devices = await this.prisma.device.findMany({ where: { isActive: true }, select: { id: true } });
    for (const device of devices) {
      await this.zkUserService.enqueueDelete(device.id, uid);
    }

    return { message: 'User deleted' };
  }

  async bulkRemove(ids: string[]) {
    await this.prisma.user.deleteMany({ where: { id: { in: ids } } });

    const devices = await this.prisma.device.findMany({ where: { isActive: true }, select: { id: true } });
    for (const id of ids) {
      const uid = uuidToDeviceUserId(id);
      for (const device of devices) {
        await this.zkUserService.enqueueDelete(device.id, uid);
      }
    }

    return { message: 'Users deleted' };
  }
}
