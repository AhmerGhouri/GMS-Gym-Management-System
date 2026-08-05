import type { CreateDeviceUserDto } from '../dto/create-device-user.dto';
import type { UpdateDeviceUserDto } from '../dto/update-device-user.dto';

/** Attendance sync job data. */
export interface AttendanceJobData {
  deviceId: string;
}

/** Health check job data. */
export interface HealthJobData {
  deviceId: string;
}

/** User operation job data. */
export interface UserJobData {
  deviceId: string;
  syncJobId?: string;
  payload: CreateDeviceUserDto | UpdateDeviceUserDto | { userId: number };
}

/** Job names for the user queue. */
export type UserJobName = 'createUser' | 'deleteUser' | 'updateUser';
