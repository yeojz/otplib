import { AlgorithmError, HMACError, RandomBytesError } from "./errors.js";
import { normalizeHashAlgorithm } from "./utils.js";

import type { CryptoPlugin, HashAlgorithm } from "./types.js";

/**
 * CryptoContext provides a unified interface for crypto operations
 * using a pluggable crypto backend
 */
export class CryptoContext {
  /**
   * Create a new CryptoContext with the given crypto plugin
   *
   * @param crypto - The crypto plugin to use
   */
  constructor(private readonly crypto: CryptoPlugin) {}

  /**
   * Get the underlying crypto plugin
   */
  get plugin(): CryptoPlugin {
    return this.crypto;
  }

  /**
   * Resolve an algorithm against the plugin's own supported set
   *
   * When a plugin declares `algorithms`, an unsupported value is rejected here
   * rather than the plugin being left to discover it after delegation.
   *
   * @param algorithm - The hash algorithm to resolve
   * @returns The canonical lowercase algorithm
   * @throws {AlgorithmUnsupportedError} If the algorithm is not supported
   */
  private normalize(algorithm: HashAlgorithm): HashAlgorithm {
    return normalizeHashAlgorithm(algorithm, {
      supported: this.crypto.algorithms,
      plugin: this.crypto.name,
    });
  }

  /**
   * Compute HMAC using the configured crypto plugin
   *
   * @param algorithm - The hash algorithm to use
   * @param key - The secret key as a byte array
   * @param data - The data to authenticate as a byte array
   * @returns HMAC digest as a byte array
   * @throws {AlgorithmUnsupportedError} If the algorithm is not supported
   * @throws {HMACError} If HMAC computation fails
   */
  async hmac(algorithm: HashAlgorithm, key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
    // Normalized outside the try so the algorithm error surfaces as-is rather
    // than being rewrapped as an HMACError.
    const normalized = this.normalize(algorithm);

    try {
      const result = this.crypto.hmac(normalized, key, data);
      return result instanceof Promise ? await result : result;
    } catch (error) {
      // Reachable when a plugin narrows its own set without declaring
      // `algorithms` - the check above passed, so the plugin rejects instead.
      // That is still an algorithm rejection, not an HMAC failure.
      if (error instanceof AlgorithmError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      throw new HMACError(message, { cause: error });
    }
  }

  /**
   * Synchronous HMAC computation
   *
   * @param algorithm - The hash algorithm to use
   * @param key - The secret key as a byte array
   * @param data - The data to authenticate as a byte array
   * @returns HMAC digest as a byte array
   * @throws {AlgorithmUnsupportedError} If the algorithm is not supported
   * @throws {HMACError} If HMAC computation fails or if crypto plugin doesn't support sync operations
   */
  hmacSync(algorithm: HashAlgorithm, key: Uint8Array, data: Uint8Array): Uint8Array {
    const normalized = this.normalize(algorithm);

    try {
      const result = this.crypto.hmac(normalized, key, data);
      if (result instanceof Promise) {
        throw new HMACError("Crypto plugin does not support synchronous HMAC operations");
      }
      return result;
    } catch (error) {
      if (error instanceof HMACError || error instanceof AlgorithmError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      throw new HMACError(message, { cause: error });
    }
  }

  /**
   * Generate cryptographically secure random bytes
   *
   * @param length - Number of random bytes to generate
   * @returns Random bytes
   * @throws {RandomBytesError} If random byte generation fails
   */
  randomBytes(length: number): Uint8Array {
    try {
      return this.crypto.randomBytes(length);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new RandomBytesError(message, { cause: error });
    }
  }
}

/**
 * Create a CryptoContext from a crypto plugin
 *
 * @param crypto - The crypto plugin to use
 * @returns A new CryptoContext instance
 */
export function createCryptoContext(crypto: CryptoPlugin): CryptoContext {
  return new CryptoContext(crypto);
}
