import type { DeviceConnectionType, DeviceStatus } from '@prisma/client';

/** Represents a Device entity from the database for use in device operations. */
export interface DeviceRecord {
  id: string;
  name: string;
  ipAddress: string;
  port: number;
  connectionType: DeviceConnectionType;
  status: DeviceStatus;
  serialNumber: string | null;
  lastSyncAt: Date | null;
  lastSeen: Date | null;
  responseTimeMs: number | null;
  isActive: boolean;
}

/** Minimal device info required for connection operations. */
export interface DeviceConnectionInfo {
  id: string;
  name: string;
  ipAddress: string;
  port: number;
}