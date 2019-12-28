# @otplib/core-async

> Async aware versions of otplib methods

This library adds `async` aware versions of methods that are found in `@otplib/core`.
Refer to the main [otplib documentation][project-v-readme] instead for the `non-async` version.

<!-- TOC depthFrom:2 -->

- [Install](#install)
- [Getting Started](#getting-started)
  - [Using Async Replacements](#using-async-replacements)
  - [Async over Sync Methods](#async-over-sync-methods)
- [References](#references)
  - [Async Methods](#async-methods)
  - [Async Options](#async-options)
- [License](#license)
  <!-- /TOC -->

## Install

```bash
npm install --save @otplib/core-async
```

## Getting Started

There are 2 was to use `async` - using async replacements, or handling digests separately.

### Using Async Replacements

This is the simplest way to get started. Other than `allOptions()` and `resetOptions`,
all other methods are converted to async and thus needs to be `Promise.resolve` or `await`.
eg: `await .generate(...)`, `await .check(...)`

```js
import { AuthenticatorAsync } from '@otplib/core-async';

const authenticator = new AuthenticatorAsync({
  // ...options
  // make sure you use async versions of
  // required functions like createDigest.
});

// Note: await needed as all methods are async
const token = await authenticator.generate(secret);
```

### Async over Sync Methods

In this method, you would essentially take over the digest generation, leaving
the library to handle the digest to token conversion.

```js
import { Authenticator } from '@otplib/core';
import { authenticatorDigestAsync } from '@otplib/core-async';

// This is a synchronous Authenticator class.
const authenticator = new Authenticator({
  // ...options
});

// Override the digest generation.
const digest = await authenticatorDigestAsync(secret, {
  ...authenticator.allOptions(),
  createDigest: async (algorithm, hmacKey, counter) => 'string'; // put your async implementation
});

authenticator.options = { digest };
const token = authenticator.generate(secret);

// recommended: reset to remove the digest.
authenticator.resetOptions();

// reference test in: ./packages/tests-builds/example.test.js
```

## References

### Async Methods

All async functions are suffixed with `Async` except for class methods.
eg: `await authenticatorTokenAsync(...)` instead of `authenticatorToken(...)`

Check the [API Documentation][project-v-api] for the full list of async functions.

### Async Options

The following options are modified for `functions` and `classes` which are suffixed with `Async`.

eg: `AuthenticatorAsync`, `totpDigestAsync`, `hotpTokenAsync` etc.

| Option            | Type           | Output                                              |
| ----------------- | -------------- | --------------------------------------------------- |
| createDigest      | async function | function returns Promise<string\> instead of string |
| createHmacKey     | async function | function returns Promise<string\> instead of string |
| createRandomBytes | async function | function returns Promise<string\> instead of string |
| keyEncoder        | async function | function returns Promise<string\> instead of string |
| keyDecoder        | async function | function returns Promise<string\> instead of string |

## License

`@otplib/core-async` is [MIT licensed][project-license]

[project-license]: https://github.com/yeojz/otplib/blob/master/LICENSE
[project-v-api]: https://otplib.yeojz.com/api
[project-v-readme]: https://github.com/yeojz/otplib/blob/master/README.md
