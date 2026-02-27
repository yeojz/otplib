// Default guardrail values from @otplib/core
// These match RFC recommendations and library defaults
export const GUARDRAIL_DEFAULTS = {
  MIN_SECRET_BYTES: 16, // RFC 4226: 128 bits minimum
  MAX_SECRET_BYTES: 64, // 512 bits maximum
  MIN_PERIOD: 1, // 1 second minimum
  MAX_PERIOD: 3600, // 1 hour maximum
} as const;

export type GuardrailKey = keyof typeof GUARDRAIL_DEFAULTS;

export const GUARDRAIL_KEYS = Object.keys(GUARDRAIL_DEFAULTS) as GuardrailKey[];

export function formatGuardrailsTable(configured: Record<string, number>): string {
  const maxKeyLen = Math.max(...GUARDRAIL_KEYS.map((k) => k.length));

  const lines: string[] = [];
  lines.push("Guardrail".padEnd(maxKeyLen + 2) + "Configured  Default");
  lines.push("-".repeat(maxKeyLen + 2) + "-".repeat(22));

  for (const key of GUARDRAIL_KEYS) {
    const configuredValue = configured[key];
    const defaultValue = GUARDRAIL_DEFAULTS[key];
    const configuredStr = configuredValue !== undefined ? String(configuredValue) : "-";
    lines.push(`${key.padEnd(maxKeyLen + 2)}${configuredStr.padEnd(12)}${defaultValue}`);
  }

  return lines.join("\n");
}

export function normalizeGuardrailKey(key: string): string {
  const normalizedKey = key.replace(/^OTPLIB_/, "") as GuardrailKey;

  if (!GUARDRAIL_KEYS.includes(normalizedKey)) {
    throw new Error(`invalid guardrail key: ${key} (valid: ${GUARDRAIL_KEYS.join(", ")})`);
  }

  return `OTPLIB_${normalizedKey}`;
}

export function validateGuardrailValue(value: string): number {
  const numValue = parseInt(value, 10);
  if (isNaN(numValue) || numValue < 1) {
    throw new Error("value must be a positive integer");
  }
  return numValue;
}
