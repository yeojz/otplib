export interface StorageStatus {
  initialized: boolean;
  keySource: "env" | "file" | null;
  envPath: string | null;
  keysPath: string | null;
}

export interface OtplibxStorage {
  status(filePath: string): Promise<StorageStatus>;
  init(filePath: string): Promise<void>;
  load(filePath: string): Promise<Record<string, string>>;
  set(filePath: string, key: string, value: string): Promise<void>;
  remove(filePath: string, key: string): Promise<void>;
}
