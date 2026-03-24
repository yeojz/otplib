import type { HashAlgorithm } from "@otplib/core";

const algorithmToCXF: Record<HashAlgorithm, string> = {
  sha1: "SHA1",
  sha256: "SHA256",
  sha512: "SHA512",
};

const cxfToAlgorithm: Record<string, HashAlgorithm> = {
  SHA1: "sha1",
  SHA256: "sha256",
  SHA512: "sha512",
};

export function toCorAlgorithm(cxfAlgo: string | undefined): HashAlgorithm {
  if (!cxfAlgo) return "sha1";
  const mapped = cxfToAlgorithm[cxfAlgo.toUpperCase()];
  return mapped ?? "sha1";
}

export function toCXFAlgorithm(algo: HashAlgorithm | undefined): string {
  if (!algo) return "SHA1";
  return algorithmToCXF[algo] ?? "SHA1";
}
