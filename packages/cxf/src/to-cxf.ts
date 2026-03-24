import { toCXFAlgorithm } from "./constants.js";

import type { CXFDocument, CXFAccount, CXFItem, CXFTOTPCredential } from "./types.js";
import type { OTPAccount } from "@otplib/core";

/**
 * Options for controlling CXF serialization.
 */
export type ToCXFOptions = {
  /**
   * Name of the exporting application.
   * Default: 'otplib'
   */
  exporterName?: string;
};

let uuidCounter = 0;

function generateId(): string {
  try {
    // Available in Node 19+, all modern browsers, Deno, Bun
    return crypto.randomUUID();
  } catch {
    // Fallback for environments without crypto.randomUUID
    uuidCounter += 1;
    return `otplib-${Date.now()}-${uuidCounter}`;
  }
}

function accountToItem(account: OTPAccount): CXFItem {
  const cred: CXFTOTPCredential = {
    secret: account.secret,
    period: account.period ?? 30,
    digits: account.digits ?? 6,
    algorithm: toCXFAlgorithm(account.algorithm),
    ...(account.name !== undefined && { username: account.name }),
    ...(account.issuer !== undefined && { issuer: account.issuer }),
  };

  return {
    id: generateId(),
    type: account.type,
    creation_date: Math.floor(Date.now() / 1000),
    credentials: {
      [account.type]: cred,
    },
  };
}

/**
 * Wrap OTPAccount entries into a CXF-structured JSON document.
 *
 * Produces a CXF document containing only TOTP/HOTP credentials.
 * Each account becomes an item within a single CXF account.
 *
 * @param accounts - array of OTPAccount entries to include
 * @param options - serialization options
 * @returns a CXF document object (call JSON.stringify() to serialize)
 */
export function toCXF(accounts: OTPAccount[], options?: ToCXFOptions): CXFDocument {
  const { exporterName = "otplib" } = options ?? {};

  const items: CXFItem[] = accounts.map(accountToItem);

  const cxfAccount: CXFAccount = {
    id: generateId(),
    items,
    extensions: [],
  };

  return {
    version: { major: 1, minor: 0 },
    exporter: { name: exporterName },
    export_date: Math.floor(Date.now() / 1000),
    accounts: [cxfAccount],
  };
}
