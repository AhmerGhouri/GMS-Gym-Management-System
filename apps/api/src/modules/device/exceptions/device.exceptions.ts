import { HttpException, HttpStatus } from '@nestjs/common';

/** Thrown when a device TCP connection cannot be established. */
export class DeviceConnectionException extends HttpException {
  constructor(
    deviceName: string,
    cause?: string,
  ) {
    super(
      `Failed to connect to device "${deviceName}"${cause ? `: ${cause}` : ''}`,
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

/** Thrown when a device operation fails after all retries. */
export class DeviceOperationException extends HttpException {
  constructor(
    operation: string,
    deviceName: string,
    cause?: string,
  ) {
    super(
      `Device operation "${operation}" failed on "${deviceName}"${cause ? `: ${cause}` : ''}`,
      HttpStatus.BAD_GATEWAY,
    );
  }
}

/** Thrown when a device is not found in the database. */
export class DeviceNotFoundException extends HttpException {
  constructor(deviceId: string) {
    super(`Device with ID "${deviceId}" not found`, HttpStatus.NOT_FOUND);
  }
}

/** Thrown when a distributed lock cannot be acquired (non-fatal, skip operation). */
export class DeviceLockException extends Error {
  constructor(lockKey: string) {
    super(`Could not acquire lock: ${lockKey}`);
    this.name = 'DeviceLockException';
  }
}
