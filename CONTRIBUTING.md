# Contributing

[![PRs Welcome][pr-welcome-badge]][pr-welcome-link]

Thank you for opening (and reading) this document. :)
We are open to, and grateful for, any contributions made.

## Semantic Versioning
This repository generally follows semantic versioning. We release patch versions for bug fixes, minor versions for new features, and major versions for any breaking changes.

All releases to npm or any other supported distribution channels will corresponding to a tagged commit.

## `yarn` vs `npm`

This repository currently uses `yarn` as a development tool, but you may use `npm` instead.

## Testing

To only run linting:

`yarn lint`

To only run tests:

`yarn test`

To get coverage report:

`yarn test && yarn coverage`

To continuously watch and run tests, run the following:

`yarn test:watch`

## Sending a Pull Request

If you send a pull request, please do it against the master branch.

Please __do not__ bump the version and tag your pull request with a v\[number\] as it corresponds to a release.

Before submitting a pull request, please make sure the following is done:

-   Fork the repository and create your branch from master.
-   If you've added code that should be tested, add tests!
-   Ensure the test suite passes (`yarn test`).
-   Make sure your code lints (`yarn lint`).
-   Make sure coverage is decent (run `yarn coverage` after running `yarn test`)

Thank you for contributing!

[pr-welcome-badge]: https://img.shields.io/badge/PRs-Welcome-ff69b4.svg?style=flat-square
[pr-welcome-link]: https://github.com/yeojz/otplib/blob/master/CONTRIBUTING.md
