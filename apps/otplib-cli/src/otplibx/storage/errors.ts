export const ErrorCodes = {
  NOT_INITIALIZED: "NOT_INITIALIZED",
  INVALID_KEY: "INVALID_KEY",
  DECRYPT_FAILED: "DECRYPT_FAILED",
  FILE_NOT_FOUND: "FILE_NOT_FOUND",
  ALREADY_INITIALIZED: "ALREADY_INITIALIZED",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export class OtplibxStorageError extends Error {
  public readonly code: ErrorCode;

  constructor(message: string, code: ErrorCode) {
    super(message);
    this.name = "OtplibxStorageError";
    this.code = code;
  }
}
