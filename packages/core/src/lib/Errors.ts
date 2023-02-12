export const ERR_TERM = 'ERR_TERM';
export const ERR_TIMEOUT = 'ERR_TIMEOUT';

export const ERROR_CODES = [ERR_TERM, ERR_TIMEOUT] as const;

export type SharedStoreErrorCode = typeof ERROR_CODES[number];

export function isSharedStoreErrorCode(
  error: unknown
): error is SharedStoreErrorCode {
  return (
    typeof error === 'string' &&
    ERROR_CODES.includes(error as SharedStoreErrorCode)
  );
}

export function isTerminatedError(error: unknown): error is typeof ERR_TERM {
  return error === ERR_TERM;
}

export function isTimeoutError(error: unknown): error is typeof ERR_TIMEOUT {
  return error === ERR_TIMEOUT;
}
