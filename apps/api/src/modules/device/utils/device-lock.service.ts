import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeviceLockException } from '../exceptions/index';

/* eslint-disable @typescript-eslint/no-require-imports */
// redlock v5 and ioredis use ESM default exports.
// Webpack's CJS interop may not resolve `import X from 'y'` correctly,
// so we use require + .default to be explicit.
const RedlockModule = require('redlock');
const Redlock = RedlockModule.default || RedlockModule;
const IORedisModule = require('ioredis');
const IORedis = IORedisModule.default || IORedisModule;
/* eslint-enable @typescript-eslint/no-require-imports */

/**
 * Redis-based distributed lock service using Redlock.
 *
 * Prevents concurrent device operations across multiple app instances.
 * If a lock cannot be acquired, a `DeviceLockException` is thrown — callers
 * should catch it and skip the operation rather than crashing.
 */
@Injectable()
export class DeviceLockService implements OnModuleDestroy {
  private readonly logger = new Logger(DeviceLockService.name);
  private readonly redlock: InstanceType<typeof Redlock>;
  private readonly redis: InstanceType<typeof IORedis>;

  constructor(private readonly config: ConfigService) {
    this.redis = new IORedis({
      host: this.config.get<string>('REDIS_HOST', 'localhost'),
      port: this.config.get<number>('REDIS_PORT', 6379),
      maxRetriesPerRequest: null, // required for BullMQ compatibility
      lazyConnect: true,
    });

    this.redlock = new Redlock([this.redis], {
      driftFactor: 0.01,
      retryCount: 3,
      retryDelay: 200,
      retryJitter: 200,
    });

    // Redlock error handler — log but don't crash
    this.redlock.on('error', (err: Error) => {
      this.logger.warn(`Redlock error: ${err.message}`);
    });
  }

  /**
   * Acquire a distributed lock.
   *
   * @param key - Lock key (e.g. `gms:device-lock:sync:device-uuid`)
   * @param ttl - Time-to-live in ms. Lock auto-releases after this period.
   * @returns A release function. Call it in a `finally` block.
   * @throws DeviceLockException if the lock cannot be acquired.
   */
  async acquire(key: string, ttl: number): Promise<() => Promise<void>> {
    try {
      const lock = await this.redlock.acquire([`lock:${key}`], ttl);
      this.logger.debug(`Lock acquired: ${key}`);
      return async () => {
        try {
          await lock.release();
          this.logger.debug(`Lock released: ${key}`);
        } catch (releaseErr) {
          // Lock may have already expired — that's OK
          this.logger.warn(`Lock release failed (may have expired): ${key}`);
        }
      };
    } catch {
      throw new DeviceLockException(key);
    }
  }

  /**
   * Try to acquire a lock. Returns `null` if the lock is already held
   * instead of throwing. Useful for schedulers that should silently skip.
   */
  async tryAcquire(key: string, ttl: number): Promise<(() => Promise<void>) | null> {
    try {
      return await this.acquire(key, ttl);
    } catch {
      this.logger.debug(`Lock already held, skipping: ${key}`);
      return null;
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.redlock.quit();
    } catch { /* ignore */ }
    try {
      this.redis.disconnect();
    } catch { /* ignore */ }
    this.logger.log('DeviceLockService shut down');
  }
}