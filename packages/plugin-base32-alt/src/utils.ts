const NOT_HEX = /[^0-9a-f]/i;

export function hexToBytes(hex: string): Uint8Array {
  if (hex.length === 0) {
    return new Uint8Array(0);
  }
  if (hex.length % 2 !== 0) {
    throw new Error("Hex string must have an even number of characters");
  }
  if (NOT_HEX.test(hex)) {
    throw new Error("Hex string contains invalid characters");
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export function bytesToHex(bytes: Uint8Array): string {
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}

export function base64ToBytes(base64: string): Uint8Array {
  return new Uint8Array([...atob(base64)].map((c) => c.charCodeAt(0)));
}

export function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}
