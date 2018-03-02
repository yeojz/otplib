import crypto from "crypto";
import randomBytes from "./randomBytes";

/**
  * Crypto replacement for expo
  *
  * @module otplib-expo/crypto
  */
export default {
  createHmac: crypto.createHmac,
  randomBytes
};
