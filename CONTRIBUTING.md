# Contributing

[![PRs Welcome][pr-welcome-badge]][pr-welcome-link]

Thank you for opening (and reading) this document. :)
We are open to, and grateful for, any contributions made.

## Semantic Versioning

This repository generally follows semantic versioning. We release patch versions for bug fixes, minor versions for new features, and major versions for any breaking changes.

All releases to npm or any other supported distribution channels will corresponding to a tagged commit.

## Testing

To only run linting:

`npm run lint`

To run tests and coverage:

`npm run test`

To continuously watch and run tests, run the following:

`npm run test:watch`

## Sending a Pull Request

If you send a pull request, please do it against the master branch.

Please **do not** bump the version and tag your pull request with a v\[number\] as it corresponds to a release.

Before submitting a pull request, please make sure the following is done:

* Fork the repository and create your branch from master.
* If you've added code that should be tested, add tests!
  * Ensure the test suite passes (`npm run test`).
  * Make sure your code lints (`npm run lint`).
  * Ensure code is properly formatted `npm run lint:format`
* Make a PR to this repository's master branch.

Thank you for contributing!

[pr-welcome-badge]: https://img.shields.io/badge/PRs-Welcome-ff69b4.svg?style=flat-square
[pr-welcome-link]: https://github.com/yeojz/otplib/blob/master/CONTRIBUTING.md
