export { parse, parse as parseURI } from "./parse.js";

export { generate, generateTOTP, generateHOTP } from "./generate.js";
export type { URIOptions, TOTPURIOptions, HOTPURIOptions } from "./generate.js";

export {
  URIParseError,
  InvalidURIError,
  MissingParameterError,
  InvalidParameterError,
} from "./types.js";

export type { OTPAuthURI, OTPAuthParams, OTPType } from "./types.js";
