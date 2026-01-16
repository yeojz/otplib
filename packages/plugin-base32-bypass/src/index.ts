/**
 * @otplib/plugin-base32-bypass
 *
 * Bypass plugins for otplib - use raw string or hex secrets without Base32 encoding.
 */

import { stringToBytes, bytesToString, hexToBytes, bytesToHex } from "@otplib/core";

import type { Base32Plugin, Base32EncodeOptions } from "@otplib/core";

type BypassEncodeFunction = (data: Uint8Array) => string;
type BypassDecodeFunction = (str: string) => Uint8Array;

type BypassBase32PluginOptions = {
  encode: BypassEncodeFunction;
  decode: BypassDecodeFunction;
};

/**
 * Generic bypass plugin - provide your own encode/decode functions
 *
 * Use this when you need custom secret transformations that don't involve Base32.
 *
 * @example
 * ```ts
 * const base64Bypass = new BypassBase32Plugin({
 *   encode: (data) => btoa(String.fromCharCode(...data)),
 *   decode: (str) => new Uint8Array([...atob(str)].map(c => c.charCodeAt(0))),
 * });
 * ```
 */
export class BypassBase32Plugin implements Base32Plugin {
  readonly name: string = "bypass";
  private readonly encodeFn: BypassEncodeFunction;
  private readonly decodeFn: BypassDecodeFunction;

  constructor(options: BypassBase32PluginOptions) {
    this.encodeFn = options.encode;
    this.decodeFn = options.decode;
  }

  encode(data: Uint8Array, _options?: Base32EncodeOptions): string {
    return this.encodeFn(data);
  }

  decode(str: string): Uint8Array {
    return this.decodeFn(str);
  }
}

/**
 * UTF-8 string bypass - treats secrets as plain text
 *
 * Use this when your secret is a plain text string that should be
 * converted directly to bytes without Base32 encoding.
 *
 * @example
 * ```ts
 * import { StringBypassPlugin } from '@otplib/plugin-base32-bypass';
 * import { generate } from '@otplib/totp';
 *
 * const plugin = new StringBypassPlugin();
 * await generate({ secret: "mysecretkey", base32: plugin, crypto });
 * ```
 */
export class StringBypassPlugin extends BypassBase32Plugin {
  override readonly name = "string-bypass";

  constructor() {
    super({
      encode: bytesToString,
      decode: stringToBytes,
    });
  }
}

/**
 * Hex string bypass - treats secrets as hex-encoded bytes
 *
 * Use this when your secret is a hex string that should be
 * converted to bytes without Base32 encoding.
 *
 * @example
 * ```ts
 * import { HexBypassPlugin } from '@otplib/plugin-base32-bypass';
 * import { generate } from '@otplib/totp';
 *
 * const plugin = new HexBypassPlugin();
 * await generate({ secret: "4d79736563726574", base32: plugin, crypto });
 * ```
 */
export class HexBypassPlugin extends BypassBase32Plugin {
  override readonly name = "hex-bypass";

  constructor() {
    super({
      encode: bytesToHex,
      decode: hexToBytes,
    });
  }
}

/**
 * Frozen singleton instance of StringBypassPlugin
 *
 * @example
 * ```ts
 * import { stringBypass } from '@otplib/plugin-base32-bypass';
 *
 * await generate({ secret: "mysecret", base32: stringBypass, crypto });
 * ```
 */
export const stringBypass: Base32Plugin = Object.freeze(new StringBypassPlugin());

/**
 * Frozen singleton instance of HexBypassPlugin
 *
 * @example
 * ```ts
 * import { hexBypass } from '@otplib/plugin-base32-bypass';
 *
 * await generate({ secret: "4d79736563726574", base32: hexBypass, crypto });
 * ```
 */
export const hexBypass: Base32Plugin = Object.freeze(new HexBypassPlugin());

export type { BypassBase32PluginOptions, BypassEncodeFunction, BypassDecodeFunction };
