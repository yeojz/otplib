import crypto from "node:crypto";

function scryptAsync(
  password: string,
  salt: Buffer,
  keylen: number,
  options: crypto.ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keylen, options, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

export type KdfParams = {
  salt: Buffer;
  N: number;
  r: number;
  p: number;
};

export type DeriveKekOptions = Partial<KdfParams>;

export type DeriveKekResult = {
  kek: Buffer;
  params: KdfParams;
};

export type WrappedKey = {
  nonce: Buffer;
  ciphertext: Buffer;
  tag: Buffer;
};

export async function deriveKek(
  passphrase: string,
  options: DeriveKekOptions = {},
): Promise<DeriveKekResult> {
  const salt = options.salt ?? crypto.randomBytes(16);
  const N = options.N ?? 2 ** 14;
  const r = options.r ?? 8;
  const p = options.p ?? 1;

  const kek = await scryptAsync(passphrase, salt, 32, { N, r, p });

  return {
    kek,
    params: { salt, N, r, p },
  };
}

export function wrapDek(dek: Buffer, kek: Buffer, nonce?: Buffer): WrappedKey {
  const iv = nonce ?? crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", kek, iv);

  const ciphertext = Buffer.concat([cipher.update(dek), cipher.final()]);
  const tag = cipher.getAuthTag();

  return { nonce: iv, ciphertext, tag };
}

export function unwrapDek(wrapped: WrappedKey, kek: Buffer): Buffer {
  const decipher = crypto.createDecipheriv("aes-256-gcm", kek, wrapped.nonce);
  decipher.setAuthTag(wrapped.tag);

  return Buffer.concat([decipher.update(wrapped.ciphertext), decipher.final()]);
}
