/**
 * Classifies ZKTeco errors into categories to determine whether to
 * retry, skip gracefully, or report as fatal.
 *
 * This is the SINGLE place where raw ZKTeco/network error strings are
 * interpreted — no other service should contain error-classification logic.
 */

/** Error classification buckets. */
export type ZkErrorCategory = 'TRANSIENT' | 'NO_DATA' | 'FATAL';

/** Known error message fragments mapped to their category. */
const ERROR_PATTERNS: ReadonlyArray<{ pattern: RegExp; category: ZkErrorCategory }> = [
  // ── NO_DATA: Device is reachable but has nothing to return ──
  { pattern: /TIMEOUT_IN_RECEIVING_RESPONSE_AFTER_REQUESTING_DATA/i, category: 'NO_DATA' },
  { pattern: /timeout in receiving/i, category: 'NO_DATA' },

  // ── TRANSIENT: Retryable network / connection issues ──
  { pattern: /ECONNREFUSED/i, category: 'TRANSIENT' },
  { pattern: /ECONNRESET/i, category: 'TRANSIENT' },
  { pattern: /ETIMEDOUT/i, category: 'TRANSIENT' },
  { pattern: /EHOSTUNREACH/i, category: 'TRANSIENT' },
  { pattern: /ENETUNREACH/i, category: 'TRANSIENT' },
  { pattern: /EPIPE/i, category: 'TRANSIENT' },
  { pattern: /socket.*timeout/i, category: 'TRANSIENT' },
  { pattern: /network.*unreachable/i, category: 'TRANSIENT' },
  { pattern: /connection.*reset/i, category: 'TRANSIENT' },
  { pattern: /SOCKET_TIMEOUT/i, category: 'TRANSIENT' },

  // ── FATAL: Non-retryable ──
  { pattern: /authentication.*fail/i, category: 'FATAL' },
  { pattern: /invalid.*packet/i, category: 'FATAL' },
  { pattern: /protocol.*error/i, category: 'FATAL' },
];

/**
 * Classify an error thrown by zkteco-js or the underlying TCP socket.
 *
 * @returns The error category. Defaults to `TRANSIENT` for unknown errors
 *          (better to retry than to lose data).
 */
export function classifyZkError(error: unknown): ZkErrorCategory {
  const message = error instanceof Error ? error.message : String(error);

  for (const { pattern, category } of ERROR_PATTERNS) {
    if (pattern.test(message)) {
      return category;
    }
  }

  // Unknown errors default to TRANSIENT so we retry rather than silently fail
  return 'TRANSIENT';
}

/** Returns true if the error is retryable (TRANSIENT). */
export function isRetryableError(error: unknown): boolean {
  return classifyZkError(error) === 'TRANSIENT';
}

/** Returns true if the error means "no data available" (not a real error). */
export function isNoDataError(error: unknown): boolean {
  return classifyZkError(error) === 'NO_DATA';
}
