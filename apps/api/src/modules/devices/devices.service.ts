import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient, DeviceConnectionType } from '@prisma/client';
import { ZktecoService } from '../../core/services/zkteco.service';
import { Logger } from '@nestjs/common';

const prisma = new PrismaClient();

@Injectable()
export class DevicesService {
  private readonly logger = new Logger(DevicesService.name);

  constructor(private readonly zkteco: ZktecoService) {}

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

  async createDevice(data: {
    name: string;
    ipAddress: string;
    port: number;
    connectionType: DeviceConnectionType;
    serialNumber?: string;
  }) {
    return prisma.device.create({
      data: {
        name: data.name,
        ipAddress: data.ipAddress,
        port: Number(data.port),
        connectionType: data.connectionType,
        serialNumber: data.serialNumber,
      },
    });
  }

  async updateDevice(
    id: string,
    data: {
      name?: string;
      ipAddress?: string;
      port?: number;
      connectionType?: DeviceConnectionType;
      serialNumber?: string;
      isActive?: boolean;
    },
  ) {
    const device = await prisma.device.findUnique({ where: { id } });
    if (!device) throw new NotFoundException('Device not found');

    return prisma.device.update({
      where: { id },
      data: {
        name: data.name,
        ipAddress: data.ipAddress,
        port: data.port !== undefined ? Number(data.port) : undefined,
        connectionType: data.connectionType,
        serialNumber: data.serialNumber,
        isActive: data.isActive,
      },
    });
  }

  async deleteDevice(id: string) {
    const device = await prisma.device.findUnique({ where: { id } });
    if (!device) throw new NotFoundException('Device not found');

    await prisma.device.delete({ where: { id } });
  }

  async testConnection(id: string) {
    const device = await prisma.device.findUnique({ where: { id } });
    if (!device) throw new NotFoundException('Device not found');

    try {
      const success = await this.zkteco.testConnection(device.id);
      if (success) {
        await prisma.device.update({ where: { id: device.id }, data: { status: 'ONLINE' } });
        return { success: true, message: 'Connection successful' };
      } else {
        await prisma.device.update({ where: { id: device.id }, data: { status: 'OFFLINE' } });
        throw new BadRequestException('Connection failed: Unable to connect to device');
      }
    } catch (error: any) {
      await prisma.device.update({ where: { id: device.id }, data: { status: 'OFFLINE' } });
      throw new BadRequestException(`Connection failed: ${error.message}`);
    }
  }

  async syncDevice(id: string) {
    const device = await prisma.device.findUnique({ where: { id } });
    if (!device) throw new NotFoundException('Device not found');
    if (!device.isActive) throw new BadRequestException('Device is inactive');

    try {
      const logs = await this.zkteco.getAttendances(device.id);
      let newCount = 0;

      if (logs.length > 0) {
        for (const log of logs) {
          const reconstructedMemberId = `GMS-${String(log.user_id).padStart(4, '0')}`;
          const member = await prisma.member.findFirst({
            where: { memberId: reconstructedMemberId },
          });

          if (member) {
            const existingLog = await prisma.attendanceLog.findFirst({
              where: {
                memberId: member.id,
                deviceId: device.id,
                checkIn: new Date(log.record_time),
              },
            });

            if (!existingLog) {
              await prisma.attendanceLog.create({
                data: {
                  memberId: member.id,
                  deviceId: device.id,
                  checkIn: new Date(log.record_time),
                },
              });
              newCount++;
            }
          }
        }
        await this.zkteco.clearAttendances(device.id);
      }

      await prisma.device.update({
        where: { id: device.id },
        data: { status: 'ONLINE', lastSyncAt: new Date() },
      });

      return { success: true, message: `Synced ${newCount} new records.` };
    } catch (error: any) {
      this.logger.error(`Failed to manually sync device ${device.id}: ${error}`);
      await prisma.device.update({
        where: { id: device.id },
        data: { status: 'OFFLINE' },
      });
      throw new BadRequestException(`Sync failed: ${error.message}`);
    }
  }
}
