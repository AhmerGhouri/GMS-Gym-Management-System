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
  { pattern: /NO_REPLY_DATA/i, category: 'NO_DATA' },

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
 * Extract a human-readable error message from any error type.
 *
 * ZkError objects from zkteco-js wrap the real error in an `err` property
 * and toString() as `[object Object]`. This helper digs out the real message.
 */
export function extractErrorMessage(error: unknown): string {
  if (!error) return 'Unknown error';

  // ZkError from zkteco-js: { err: Error, ip: string, command: string }
  if (typeof error === 'object' && error !== null) {
    const obj = error as Record<string, unknown>;

    // If it has an 'err' property (ZkError wrapper), extract inner message
    if ('err' in obj && obj.err) {
      const inner = obj.err;
      if (inner instanceof Error) return inner.message;
      if (typeof inner === 'string') return inner;
      return extractErrorMessage(inner); // recurse for deep nesting
    }

    // Standard Error
    if (error instanceof Error) return error.message;

    // If toString produces something useful (not [object Object])
    const str = String(error);
    if (str !== '[object Object]') return str;

    // Last resort: JSON stringify
    try {
      return JSON.stringify(error);
    } catch {
      return 'Unknown error (non-serializable)';
    }
  }

  return String(error);
}

/**
 * Classify an error thrown by zkteco-js or the underlying TCP socket.
 *
 * @returns The error category. Defaults to `TRANSIENT` for unknown errors
 *          (better to retry than to lose data).
 */
export function classifyZkError(error: unknown): ZkErrorCategory {
  const message = extractErrorMessage(error);

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
