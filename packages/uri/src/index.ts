export { parse } from "./parse.js";

export { generate, generateTOTP, generateHOTP } from "./generate.js";
export type { URIOptions, TOTPURIOptions, HOTPURIOptions } from "./generate.js";

export { parseURI, generateURIFromAccount } from "./account.js";

export {
  URIParseError,
  InvalidURIError,
  MissingParameterError,
  InvalidParameterError,
} from "./types.js";

export type { OTPAuthURI, OTPAuthParams, OTPType } from "./types.js";
