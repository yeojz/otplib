# @otplib/preset-browser

> Independent otplib browser bundle containing browser-compatible plugins

`@otplib/preset-browser` is a self-contained `umd` bundle, with `Buffer` split out
as an external dependency and certain defaults chosen to reduce the browser size.

<!-- TOC depthFrom:2 -->

- [Getting Started](#getting-started)
- [Plugins Used](#plugins-used)
- [Bundle Size](#bundle-size)
- [License](#license)

<!-- /TOC -->

## Getting Started

> Check out the main [project documentation][project-v-readme] for
> more information on the library.

There are 2 scripts required: `@otplib/preset-browser/index.js` and `@otplib/preset-browser/buffer.js`.

```html
<script src="https://unpkg.com/@otplib/preset-browser@^12.0.0/buffer.js"></script>
<script src="https://unpkg.com/@otplib/preset-browser@^12.0.0/index.js"></script>

<script type="text/javascript">
  // window.otplib.authenticator
  // window.otplib.hotp
  // window.otplib.totp
</script>
```

The `buffer.js` provided by this library is a cached copy
from [https://www.npmjs.com/package/buffer][link-npm-buffer].
You can also download and include the latest version via their project page.

In the above example, we are directly using the scripts hosted by `unpkg.com`.

You can also `npm install @otplib/preset-browser` and get the bundle
from the `node_modules/@otplib/preset-browser` folder.

## Plugins Used

The following plugins were used as default:

- **crypto**: `crypto-js`
- **encoder**: `base32-encode`
- **decoder**: `base32-decode`

For more details, you can take a look at [packages/otplib-preset-browser/src/index.ts][docs-preset-browser-src].

## Bundle Size

The approximate **bundle sizes** are as follows:

| Bundle Type                       | Size       |
| --------------------------------- | ---------- |
| original                          | 324KB      |
| original, minified + gzipped      | 102KB      |
| optimised                         | 30.9KB     |
| **optimised, minified + gzipped** | **9.53KB** |

Paired with the gzipped browser `buffer.js` module, it would be about `7.65KB + 9.53KB = 17.18KB`.

## License

`@otplib/preset-browser` is [MIT licensed][project-license]

[docs-preset-browser-src]: https://github.com/yeojz/otplib/blob/master/packages/otplib-preset-browser/src/index.ts
[link-npm-buffer]: https://www.npmjs.com/package/buffer
[project-license]: https://github.com/yeojz/otplib/blob/master/LICENSE
[project-v-readme]: https://github.com/yeojz/otplib/blob/master/README.md
