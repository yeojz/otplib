/**
 * CXF document structure (subset relevant to OTP).
 * Unknown fields are preserved during round-trips via index signatures.
 */
export type CXFDocument = {
  version: { major: number; minor: number };
  exporter?: { name: string; display_name?: string };
  export_date?: number;
  accounts: CXFAccount[];
};

export type CXFAccount = {
  id: string;
  items: CXFItem[];
  collections?: unknown[];
  extensions?: unknown[];
  [key: string]: unknown;
};

export type CXFItem = {
  id: string;
  type: string;
  creation_date?: number;
  credentials: CXFCredentials;
  [key: string]: unknown;
};

export type CXFCredentials = {
  totp?: CXFTOTPCredential;
  [key: string]: unknown;
};

export type CXFTOTPCredential = {
  secret: string;
  period?: number;
  digits?: number;
  algorithm?: string;
  username?: string;
  issuer?: string;
};
