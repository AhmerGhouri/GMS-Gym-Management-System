import { Logger } from '@nestjs/common';
import { extractErrorMessage } from './zk-error-classifier';

/** Configuration for the retry helper. */
export interface RetryOptions {
  /** Maximum number of retry attempts (not counting the initial attempt). */
  retries: number;
  /** Delay per attempt in ms — supports exponential backoff via array. */
  delays: readonly number[];
  /** Optional predicate — return `false` to abort retrying for this error. */
  shouldRetry?: (error: Error) => boolean;
  /** Called before each retry for logging. */
  onRetry?: (error: Error, attempt: number) => void;
}

const DEFAULT_OPTIONS: RetryOptions = {
  retries: 3,
  delays: [1_000, 2_000, 4_000],
};

/**
 * Generic exponential-backoff retry helper.
 *
 * - Runs `fn()` up to `retries + 1` times.
 * - Before each retry, waits for `delays[attempt]` ms.
 * - If `shouldRetry` returns `false`, throws immediately.
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  opts: Partial<RetryOptions> = {},
): Promise<T> {
  const { retries, delays, shouldRetry, onRetry } = { ...DEFAULT_OPTIONS, ...opts };
  const logger = new Logger('RetryHelper');
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // Check if we should even retry this type of error
      if (shouldRetry && !shouldRetry(lastError)) {
        logger.debug(`Non-retryable error, aborting: ${extractErrorMessage(lastError)}`);
        throw lastError;
      }

      // If this was the last attempt, throw
      if (attempt === retries) {
        break;
      }

      const delay = delays[attempt] ?? delays[delays.length - 1];
      onRetry?.(lastError, attempt + 1);
      logger.debug(`Retry ${attempt + 1}/${retries} in ${delay}ms — ${extractErrorMessage(lastError)}`);
      await new Promise<void>((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}