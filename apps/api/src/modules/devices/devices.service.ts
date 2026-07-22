import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class DevicesService {
  async getDevices() {
    return prisma.device.findMany();
  }

  async getAccessLogs() {
    return prisma.gateAccessLog.findMany({
      include: {
        member: true,
        device: true,
      },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
  }
}
