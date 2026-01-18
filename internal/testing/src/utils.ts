export function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

export function counterToBytes(value: number | bigint): Uint8Array {
  const bigintValue = typeof value === "bigint" ? value : BigInt(value);
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setBigUint64(0, bigintValue, false);
  return new Uint8Array(buffer);
}

export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

export function hexToNumber(hex: string): number {
  return parseInt(hex, 16);
}
