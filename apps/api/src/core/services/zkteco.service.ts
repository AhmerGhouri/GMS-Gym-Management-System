import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Device } from '@prisma/client';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ZKLib = require('zkteco-js');

@Injectable()
export class ZktecoService {
  private readonly logger = new Logger(ZktecoService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Connect to a specific device and return the ZKLib instance
   */
  private async connectToDevice(device: Device) {
    const zkInstance = new ZKLib(device.ipAddress, device.port, 10000, 4000);
    try {
      await zkInstance.createSocket();
      return zkInstance;
    } catch (error) {
      this.logger.error(`Failed to connect to device ${device.name} at ${device.ipAddress}: ${error}`);
      throw error;
    }
  }

  /**
   * Test connection to a ZKTeco device
   */
  async testConnection(deviceId: string) {
    const device = await this.prisma.device.findUnique({ where: { id: deviceId } });
    if (!device) throw new Error('Device not found');

    let zkInstance;
    try {
      zkInstance = await this.connectToDevice(device);
      return true;
    } catch (error) {
      return false;
    } finally {
      if (zkInstance) await zkInstance.disconnect();
    }
  }

  /**
   * Add a user to the ZKTeco machine
   */
  async addUser(deviceId: string, uid: number, userId: string, name: string) {
    const device = await this.prisma.device.findUnique({ where: { id: deviceId } });
    if (!device) throw new Error('Device not found');
    if (!device.isActive) return false;

    let zkInstance;
    try {
      zkInstance = await this.connectToDevice(device);
      // uid, userId, name, password, role, cardNumber
      await zkInstance.setUser(uid, userId, name, '', 0, 0);
      this.logger.log(`Added user ${name} (ID: ${userId}) to device ${device.name}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to add user ${userId} to device: ${error}`);
      return false;
    } finally {
      if (zkInstance) await zkInstance.disconnect();
    }
  }

  /**
   * Delete a user from the ZKTeco machine
   */
  async deleteUser(deviceId: string, uid: number) {
    const device = await this.prisma.device.findUnique({ where: { id: deviceId } });
    if (!device) throw new Error('Device not found');
    if (!device.isActive) return false;

    let zkInstance;
    try {
      zkInstance = await this.connectToDevice(device);
      await zkInstance.deleteUser(uid);
      this.logger.log(`Deleted user UID ${uid} from device ${device.name}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete user UID ${uid} from device: ${error}`);
      return false;
    } finally {
      if (zkInstance) await zkInstance.disconnect();
    }
  }

  /**
   * Fetch attendance logs from the machine
   */
  async getAttendances(deviceId: string) {
    const device = await this.prisma.device.findUnique({ where: { id: deviceId } });
    if (!device) throw new Error('Device not found');
    if (!device.isActive) return [];

    let zkInstance;
    try {
      zkInstance = await this.connectToDevice(device);
      const attendance = await zkInstance.getAttendances();
      return attendance.data || [];
    } catch (error) {
      this.logger.error(`Failed to fetch attendances from device ${device.name}: ${error}`);
      return [];
    } finally {
      if (zkInstance) await zkInstance.disconnect();
    }
  }

  /**
   * Clear attendance logs from the machine
   */
  async clearAttendances(deviceId: string) {
    const device = await this.prisma.device.findUnique({ where: { id: deviceId } });
    if (!device) throw new Error('Device not found');
    if (!device.isActive) return false;

    let zkInstance;
    try {
      zkInstance = await this.connectToDevice(device);
      await zkInstance.clearAttendanceLog();
      this.logger.log(`Cleared attendance logs on device ${device.name}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to clear attendances from device ${device.name}: ${error}`);
      return false;
    } finally {
      if (zkInstance) await zkInstance.disconnect();
    }
  }
}
