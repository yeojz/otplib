export { ErrorCodes, OtplibxStorageError } from "./errors.js";
export type { ErrorCode } from "./errors.js";

export { nativeAesStorage } from "./native-aes.js";
export type { OtplibxStorage, StorageStatus } from "./types.js";

// Default export is the native AES storage
export { nativeAesStorage as default } from "./native-aes.js";
