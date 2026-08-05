/** Raw attendance log record as returned by the ZKTeco device via zkteco-js. */
export interface ZkAttendanceRecord {
  /** Device-specific user ID (numeric). */
  user_id: number;
  /** ISO timestamp string of the attendance punch. */
  record_time: string;
  /** Verification mode (0 = fingerprint, etc.). */
  verify_mode?: number;
  /** Verification state. */
  verify_state?: number;
}

/** Prepared attendance row ready for database insertion. */
export interface AttendanceInsertRow {
  deviceId: string;
  memberId: string;
  checkIn: Date;
  attendanceHash: string;
  source: string;
}