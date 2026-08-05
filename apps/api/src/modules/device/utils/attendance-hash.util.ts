import { DEVICE_CONSTANTS } from '../constants/index';

/**
 * Generate a deterministic hash for an attendance record to prevent duplicates.
 *
 * Format: `{deviceId}-{userId}-{ISO timestamp}`
 *
 * This hash is stored in the `attendance_hash` column with a unique constraint,
 * providing a database-level deduplication guarantee.
 */
export function generateAttendanceHash(
  deviceId: string,
  userId: number,
  recordTime: string | Date,
): string {
  const isoTime = recordTime instanceof Date
    ? recordTime.toISOString()
    : new Date(recordTime).toISOString();

  return `${deviceId}-${userId}-${isoTime}`;
}

/**
 * Convert a ZKTeco device user_id to a GMS member ID string.
 *
 * Example: `10001` → `"GMS-0001"`, `10042` → `"GMS-0042"`
 * Note: A 10000 offset is applied to prevent colliding with manually added admins (IDs 1, 2, 3...)
 */
export function deviceUserIdToMemberId(deviceUserId: number): string {
  const original = deviceUserId - 10000;
  return `${DEVICE_CONSTANTS.MEMBER_ID_PREFIX}${String(original).padStart(DEVICE_CONSTANTS.MEMBER_ID_PAD_LENGTH, '0')}`;
}

/**
 * Extract the numeric device user ID from a GMS member ID string.
 *
 * Example: `"GMS-0042"` → `10042`
 * Note: A 10000 offset is added to prevent colliding with manually added admins (IDs 1, 2, 3...)
 * Returns `null` if the format is invalid.
 */
export function memberIdToDeviceUserId(memberId: string): number | null {
  const numericPart = memberId.replace(/\D/g, '');
  const parsed = parseInt(numericPart, 10);
  return isNaN(parsed) ? null : parsed + 10000;
}
