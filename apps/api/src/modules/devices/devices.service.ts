import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { DeviceConnectionType } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { ZkDeviceHealthService } from '../device/services/zk-device-health.service';
import { ZkSyncService } from '../device/services/zk-sync.service';

@Injectable()
export class DevicesService {
  private readonly logger = new Logger(DevicesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly deviceHealth: ZkDeviceHealthService,
    private readonly sync: ZkSyncService,
  ) {}

  async getDevices() {
    return this.prisma.device.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAccessLogs() {
    return this.prisma.gateAccessLog.findMany({
      include: { member: true, device: true },
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
    return this.prisma.device.create({
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
    const device = await this.prisma.device.findUnique({ where: { id } });
    if (!device) throw new NotFoundException('Device not found');

    return this.prisma.device.update({
      where: { id },
      data: {
        name: data.name,
        ipAddress: data.ipAddress,
        port: data.port !== undefined ? Number(data.port) : undefined,
        connectionType: data.connectionType,
        serialNumber: data.serialNumber,
        isActive: data.isActive,
        // Reset status to ONLINE when edited so schedulers pick it up again
        status: 'ONLINE',
        lastError: null,
        failedAt: null,
      },
    });
  }

  async deleteDevice(id: string) {
    const device = await this.prisma.device.findUnique({ where: { id } });
    if (!device) throw new NotFoundException('Device not found');

    // Delete related records first to avoid FK constraint violations
    await this.prisma.$transaction([
      this.prisma.syncJob.deleteMany({ where: { deviceId: id } }),
      this.prisma.gateAccessLog.deleteMany({ where: { deviceId: id } }),
      this.prisma.attendanceLog.deleteMany({ where: { deviceId: id } }),
      this.prisma.device.delete({ where: { id } }),
    ]);
  }

  async testConnection(id: string) {
    const device = await this.prisma.device.findUnique({ where: { id } });
    if (!device) throw new NotFoundException('Device not found');

    try {
      const result = await this.deviceHealth.pingDevice(device.id);
      if (result?.status === 'ONLINE') {
        return { success: true, message: 'Connection successful', responseTimeMs: result.responseTimeMs };
      }
      throw new BadRequestException(
        `Connection failed: ${result?.error ?? 'Unable to connect to device'}`,
      );
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Connection failed: ${message}`);
    }
  }

  async syncDevice(id: string) {
    const device = await this.prisma.device.findUnique({ where: { id } });
    if (!device) throw new NotFoundException('Device not found');
    if (!device.isActive) throw new BadRequestException('Device is inactive');

    try {
      await this.sync.syncDeviceAttendance(device.id);
      return { success: true, message: 'Sync job enqueued successfully' };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to enqueue sync for device ${device.id}: ${message}`);
      throw new BadRequestException(`Sync failed: ${message}`);
    }
  }
}
