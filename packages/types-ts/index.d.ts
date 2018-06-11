declare module 'otplib' {
  const authenticator: Authenticator;
  const hotp: HOTP;
  const totp: TOTP;
}

declare module 'otplib/authenticator' {
  const authenticator: Authenticator;
  export = authenticator;
}

declare module 'otplib/totp' {
  const totp: TOTP;
  export = totp;
}

declare module 'otplib/hotp' {
  const hotp: HOTP;
  export = hotp;
}
