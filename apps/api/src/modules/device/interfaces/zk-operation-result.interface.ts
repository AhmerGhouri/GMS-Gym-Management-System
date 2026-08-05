/** Result wrapper for any ZKTeco device operation. */
export interface ZkOperationResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  durationMs: number;
}
