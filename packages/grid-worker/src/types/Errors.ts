export const ERR_TERM = "ERR_TERM";
export const ERR_TIMEOUT = "ERR_TIMEOUT";

export const ERROR_CODES = [ERR_TERM, ERR_TIMEOUT] as const;

export type NameHereErrorCode = (typeof ERROR_CODES)[number];

export function isNameHereErrorCode(error: unknown): error is NameHereErrorCode {
  return typeof error === "string" && ERROR_CODES.includes(error as NameHereErrorCode);
}

export function isTerminatedError(error: unknown): error is typeof ERR_TERM {
  return error === ERR_TERM;
}

export function isTimeoutError(error: unknown): error is typeof ERR_TIMEOUT {
  return error === ERR_TIMEOUT;
}
