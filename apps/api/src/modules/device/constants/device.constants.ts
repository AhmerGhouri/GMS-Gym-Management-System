/**
 * Device module constants — queue names, lock prefixes, timeouts.
 * Single source of truth for all magic strings.
 */
export const DEVICE_CONSTANTS = {
  // ── BullMQ Queue Names ──
  QUEUE_ATTENDANCE: 'device-attendance',
  QUEUE_USER: 'device-user',
  QUEUE_HEALTH: 'device-health',

  // ── Redis Lock Prefixes ──
  LOCK_PREFIX: 'gms:device-lock',
  LOCK_SYNC: 'sync',
  LOCK_HEALTH: 'health',
  LOCK_USER: 'user',
  LOCK_SCHEDULER: 'scheduler',

  // ── Lock TTLs (milliseconds) ──
  LOCK_TTL_SYNC: 60_000,
  LOCK_TTL_HEALTH: 15_000,
  LOCK_TTL_USER: 30_000,
  LOCK_TTL_SCHEDULER: 120_000,

  // ── ZKTeco Connection ──
  ZK_DEFAULT_PORT: 4370,
  ZK_INACTIVITY_TIMEOUT: 10_000,
  ZK_SOCKET_TIMEOUT: 4_000,

  // ── Retry Policy ──
  RETRY_ATTEMPTS: 3,
  RETRY_DELAYS: [1_000, 2_000, 5_000] as readonly number[],

  // ── Scheduler Intervals ──
  CRON_ATTENDANCE_SYNC: '*/5 * * * *', // every 5 minutes
  CRON_HEALTH_CHECK: '*/1 * * * *',     // every minute
  CRON_SYNC_JOB: '*/1 * * * *',         // every minute

  // ── Batch Sizes ──
  SYNC_JOB_BATCH_SIZE: 10,

  // ── Member ID Format ──
  MEMBER_ID_PREFIX: 'GMS-',
  MEMBER_ID_PAD_LENGTH: 4,
} as const;

/** Type-safe access to queue names for BullMQ registration. */
export type DeviceQueueName =
  | typeof DEVICE_CONSTANTS.QUEUE_ATTENDANCE
  | typeof DEVICE_CONSTANTS.QUEUE_USER
  | typeof DEVICE_CONSTANTS.QUEUE_HEALTH;