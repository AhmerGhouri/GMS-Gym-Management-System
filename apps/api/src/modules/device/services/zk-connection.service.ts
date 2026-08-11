import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { DEVICE_CONSTANTS } from '../constants/index';
import { retryWithBackoff } from '../utils/retry.helper';
import { isRetryableError, isNoDataError, extractErrorMessage } from '../utils/zk-error-classifier';
import type { DeviceConnectionInfo } from '../interfaces/index';
import { DeviceConnectionException } from '../exceptions/index';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ZKLib = require('zkteco-js');

/** Represents an active ZKLib instance. */
interface ZkInstance {
  createSocket: () => Promise<boolean>;
  getAttendances: () => Promise<{ data: unknown[] }>;
  clearAttendanceLog: () => Promise<unknown>;
  getUsers: () => Promise<{ data: unknown[] }>;
  getInfo: () => Promise<unknown>;
  setUser: (uid: number, odUserId: string, name: string, password: string, role: number, cardno: number) => Promise<unknown>;
  deleteUser: (uid: number) => Promise<unknown>;
  disconnect: () => Promise<void>;
  /** Internal TCP transport — used for safe cleanup only. */
  ztcp?: { socket: unknown; closeSocket: () => Promise<unknown> };
  connectionType: string | null;
}

/**
 * Manages ZKTeco device connections using the `zkteco-js` library.
 *
 * Design:
 * - **Connect-per-operation**: Each operation creates a fresh ZKLib instance,
 *   executes, then disconnects. The K40 only supports one concurrent TCP session.
 * - **Retry with backoff**: Transient errors (ECONNREFUSED, timeout) are retried
 *   up to 3 times with exponential backoff.
 * - **Error classification**: `TIMEOUT_IN_RECEIVING_RESPONSE` is treated as
 *   "no data available", NOT a connection error.
 * - **Safe cleanup**: `disconnect()` is ALWAYS called in a `finally` block.
 * - **Graceful shutdown**: All tracked instances are disconnected on module destroy.
 */
@Injectable()
export class ZkConnectionService implements OnModuleDestroy {
  private readonly logger = new Logger(ZkConnectionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Track active instances for graceful shutdown. */
  private readonly activeInstances = new Set<ZkInstance>();

  /**
   * Execute an operation against a device with full lifecycle management.
   *
   * Flow: connect → execute operation → disconnect (always in finally)
   *
   * @param device - Device connection info (ip, port, name).
   * @param operation - Async function receiving the connected ZKLib instance.
   * @returns The result of the operation.
   * @throws DeviceConnectionException if connection fails after all retries.
   */
  async withConnection<T>(
    device: DeviceConnectionInfo,
    operation: (zk: ZkInstance) => Promise<T>,
  ): Promise<T> {
    let zkInstance: ZkInstance | null = null;

    try {
      // Connect with retry
      zkInstance = await this.connect(device);
      this.activeInstances.add(zkInstance);

      // Execute the operation
      return await operation(zkInstance);
    } catch (error) {
      // If it's a "no data" error, don't treat it as a failure
      if (isNoDataError(error)) {
        this.logger.debug(`No data available on device "${device.name}" — this is normal`);
        // Re-throw so the caller can handle it appropriately
        throw error;
      }

      const message = extractErrorMessage(error);
      this.logger.error(`Operation failed on device "${device.name}": ${message}`);
      throw error;
    } finally {
      if (zkInstance) {
        await this.safeDisconnect(zkInstance, device.name);
        this.activeInstances.delete(zkInstance);
      }
    }
  }

  /**
   * Create and connect a ZKLib instance with retry logic.
   */
  private async connect(device: DeviceConnectionInfo): Promise<ZkInstance> {
    return retryWithBackoff(
      async () => {
        const zk = new ZKLib(
          device.ipAddress,
          device.port,
          DEVICE_CONSTANTS.ZK_INACTIVITY_TIMEOUT,
          DEVICE_CONSTANTS.ZK_SOCKET_TIMEOUT,
        ) as ZkInstance;

        try {
          await zk.createSocket();
          this.logger.debug(`Connected to device "${device.name}" at ${device.ipAddress}:${device.port}`);
          return zk;
        } catch (err) {
          // Ensure socket is destroyed if createSocket fails partway
          await this.safeDisconnect(zk, device.name);
          throw err;
        }
      },
      {
        retries: DEVICE_CONSTANTS.RETRY_ATTEMPTS,
        delays: DEVICE_CONSTANTS.RETRY_DELAYS,
        shouldRetry: (err) => isRetryableError(err),
        onRetry: (err, attempt) => {
          this.logger.warn(
            `Connection retry ${attempt}/${DEVICE_CONSTANTS.RETRY_ATTEMPTS} for "${device.name}": ${extractErrorMessage(err)}`,
          );
        },
      },
    ).catch(async (err) => {
      const errorMessage = extractErrorMessage(err);
      
      this.logger.error(`Connection to "${device.name}" failed after all retries. Marking OFFLINE.`);
      
      try {
        await this.prisma.device.update({
          where: { id: device.id },
          data: {
            status: 'OFFLINE',
            lastError: errorMessage,
            failedAt: new Date(),
          },
        });
      } catch (dbErr) {
        this.logger.error(`Failed to update device status to OFFLINE: ${dbErr}`);
      }

      throw new DeviceConnectionException(device.name, errorMessage);
    });
  }

  /**
   * Safely disconnect a ZKLib instance — never throws.
   */
  private async safeDisconnect(zk: ZkInstance, deviceName: string): Promise<void> {
    try {
      // If the library's internal connectionType is null (failed connection),
      // calling zk.disconnect() would crash in functionWrapper(). 
      // Go directly to low-level socket cleanup instead.
      if (!zk.connectionType && zk.ztcp?.socket) {
        await zk.ztcp.closeSocket();
        this.logger.debug(`Force-closed socket for "${deviceName}" (no connectionType)`);
        return;
      }

      if (!zk.connectionType) {
        // Nothing to disconnect — connection never established
        return;
      }

      await zk.disconnect();
      this.logger.debug(`Disconnected from device "${deviceName}"`);
    } catch (err) {
      const message = extractErrorMessage(err);
      this.logger.warn(`Disconnect warning for "${deviceName}": ${message}`);
      // Never re-throw — disconnect errors are non-fatal
    }
  }

  /**
   * Graceful shutdown — disconnect all active ZKLib instances.
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log(`Shutting down — disconnecting ${this.activeInstances.size} active device(s)`);
    const disconnectPromises = Array.from(this.activeInstances).map((zk) =>
      this.safeDisconnect(zk, 'shutdown'),
    );
    await Promise.allSettled(disconnectPromises);
    this.activeInstances.clear();
    this.logger.log('All device connections closed');
  }
}