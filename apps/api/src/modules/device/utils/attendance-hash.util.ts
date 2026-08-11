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
 * Example: `18` → `"GMS-0018"`, `42` → `"GMS-0042"`
 *
 * Direct mapping — no offset. The ZKTeco K40 supports UIDs 1-3000.
 */
export function deviceUserIdToMemberId(deviceUserId: number): string {
  return `${DEVICE_CONSTANTS.MEMBER_ID_PREFIX}${String(deviceUserId).padStart(DEVICE_CONSTANTS.MEMBER_ID_PAD_LENGTH, '0')}`;
}

/**
 * Extract the numeric device user ID from a GMS member ID string.
 *
 * Example: `"GMS-0042"` → `42`, `"GMS-0001"` → `1`
 *
 * Direct mapping — no offset. The ZKTeco K40 supports UIDs 1-3000.
 * Returns `null` if the format is invalid or the UID is out of range.
 */
export function memberIdToDeviceUserId(memberId: string): number | null {
  const numericPart = memberId.replace(/\D/g, '');
  const parsed = parseInt(numericPart, 10);
  if (isNaN(parsed) || parsed <= 0 || parsed > 3000) return null;
  return parsed;
}
