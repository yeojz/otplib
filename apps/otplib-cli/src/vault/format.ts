export type OtpAlgorithm = "sha1" | "sha256" | "sha512";
export type OtpDigits = 6 | 7 | 8;

export type BaseEntry = {
  id: string;
  label: string;
  issuer?: string;
  digits: OtpDigits;
  algorithm: OtpAlgorithm;
};

export type TotpEntry = BaseEntry & {
  type: "totp";
  secret: string;
  period: number;
};

export type HotpEntry = BaseEntry & {
  type: "hotp";
  secret: string;
  counter: number;
};

export type VaultEntry = TotpEntry | HotpEntry;

export type IndexEntry = Omit<TotpEntry, "secret"> | Omit<HotpEntry, "secret">;

export type EncryptedBlock = {
  nonce: string;
  ciphertext: string;
  tag: string;
};

export type VaultFile = {
  version: 1;
  kdf: {
    alg: "scrypt";
    salt: string;
    N: number;
    r: number;
    p: number;
  };
  dekWrap: EncryptedBlock;
  index: EncryptedBlock;
  entries: Record<string, EncryptedBlock>;
};

export type VaultData = {
  entries: VaultEntry[];
};

export function entryToIndex(entry: VaultEntry): IndexEntry {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { secret, ...rest } = entry;
  return rest as IndexEntry;
}
