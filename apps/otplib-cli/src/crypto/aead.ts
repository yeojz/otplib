import crypto from "node:crypto";

export type EncryptedPayload = {
  nonce: Buffer;
  ciphertext: Buffer;
  tag: Buffer;
};

export function encryptPayload<T>(payload: T, key: Buffer, nonce?: Buffer): EncryptedPayload {
  const iv = nonce ?? crypto.randomBytes(12);
  const plaintext = Buffer.from(JSON.stringify(payload), "utf8");

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return { nonce: iv, ciphertext, tag };
}

export function decryptPayload<T>(encrypted: EncryptedPayload, key: Buffer): T {
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, encrypted.nonce);
  decipher.setAuthTag(encrypted.tag);

  const plaintext = Buffer.concat([decipher.update(encrypted.ciphertext), decipher.final()]);

  return JSON.parse(plaintext.toString("utf8")) as T;
}
