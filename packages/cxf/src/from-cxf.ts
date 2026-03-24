import { toCorAlgorithm } from "./constants.js";

import type { CXFDocument, CXFItem, CXFTOTPCredential } from "./types.js";
import type { OTPAccount } from "@otplib/core";

/**
 * Options for controlling CXF parsing behavior.
 */
export type FromCXFOptions = {
  /**
   * If true, silently skip items that are not TOTP/HOTP
   * rather than including them.
   * Default: true (since we only handle OTP types)
   */
  skipUnsupported?: boolean;
};

function isValidDocument(input: unknown): input is CXFDocument {
  if (typeof input !== "object" || input === null) return false;
  const doc = input as Record<string, unknown>;
  if (typeof doc.version !== "object" || doc.version === null) return false;
  if (!Array.isArray(doc.accounts)) return false;
  return true;
}

function itemToAccount(item: CXFItem): OTPAccount | null {
  const type = item.type;
  if (type !== "totp" && type !== "hotp") return null;

  // CXF nests credentials under the type key. TOTP and HOTP share the same credential shape.
  const cred =
    type === "totp"
      ? item.credentials?.totp
      : (item.credentials?.[type] as CXFTOTPCredential | undefined);
  if (!cred || typeof cred.secret !== "string") return null;

  const account: OTPAccount = {
    type,
    secret: cred.secret,
    ...(cred.username !== undefined && { name: cred.username }),
    ...(cred.issuer !== undefined && { issuer: cred.issuer }),
    algorithm: toCorAlgorithm(cred.algorithm),
    digits: cred.digits ?? 6,
    ...(type === "totp" && { period: cred.period ?? 30 }),
  };

  return account;
}

/**
 * Extract OTPAccount entries from a CXF JSON document.
 *
 * Accepts either a parsed JSON object or a JSON string.
 * Only extracts entries where type === 'totp' or type === 'hotp'.
 * All other credential types (passkeys, passwords, etc.) are ignored.
 *
 * @param input - CXF document as a parsed object or JSON string
 * @param options - parsing options
 * @returns array of OTPAccount entries found in the document
 * @throws if the input is not a valid CXF document structure
 */
export function fromCXF(input: CXFDocument | string, options?: FromCXFOptions): OTPAccount[] {
  const { skipUnsupported = true } = options ?? {};

  let doc: unknown;
  if (typeof input === "string") {
    try {
      doc = JSON.parse(input);
    } catch {
      throw new Error("Invalid CXF document: input is not valid JSON");
    }
  } else {
    doc = input;
  }

  if (!isValidDocument(doc)) {
    throw new Error("Invalid CXF document: missing required 'version' or 'accounts' fields");
  }

  const accounts: OTPAccount[] = [];

  for (const cxfAccount of doc.accounts) {
    if (!Array.isArray(cxfAccount?.items)) continue;

    for (const item of cxfAccount.items) {
      if (!item || typeof item.type !== "string") continue;

      if (item.type !== "totp" && item.type !== "hotp") {
        if (skipUnsupported) continue;
        continue;
      }

      const account = itemToAccount(item as CXFItem);
      if (account) {
        accounts.push(account);
      }
    }
  }

  return accounts;
}
