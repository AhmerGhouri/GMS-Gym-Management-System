/** Health status snapshot for a single device. */
export interface DeviceHealthStatus {
  deviceId: string;
  deviceName: string;
  status: 'ONLINE' | 'OFFLINE';
  responseTimeMs: number | null;
  lastSeen: Date;
  error?: string;
}
