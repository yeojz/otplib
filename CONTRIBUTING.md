# Contributing

Thank you for your interest in this project. If you can, feel free to contribute and help improve it.
There are many ways to contribute to `otplib`, and it does not only involve writing code.

Here's a few ideas to get started:

- Try out the library. Does everything work as expected? If not, just let us know by opening an issue.
- Read through the docs. If you find anything confusing or can be improved, do try to help out.
  - You can make edits by clicking "Edit" at the top of most docs.

Contributions are very welcome. If you are unsure if something fits into the library, open an issue anyway.

## Development process

GitHub is currently the source of truth. This project does have mirror repositories in bitbucket / gitlab,
but it is mostly for emergencies. All automations are wired to the GitHub project.

When a change lands on GitHub, it will be checked by the continuous integration system.

## Getting Started

```bash
git clone <REPO ADDRESS>
npm run setup
```

### Code organization

- This project's primary branch is `master`.
- Releases are managed by tags.
  - `v0.0.0` represents **stable builds**
  - `v0.0.0-0` represents **pre-releases**
- Tags follow semantic versioning.
  - patch versions for bug fixes.
  - minor versions for new features.
  - major versions for any breaking changes.
- Release information are generated from the git messages.
  - Commit messages should follow the format of [conventional-commits](https://conventionalcommits.org/).
  - Eg: `feat: description`, `fix: description`, `chore: description`

### Releases

This project is published on `npm`, mostly under 2 tags: `latest` and `next`.

`latest` contains **stable builds** while `next` contains **pre-release**.
End-users can install latest stable using `npm install otplib` and
pre-releases using `npm install otplib@next`

All releases are handled via the CI system.

### License

By contributing to `otplib`, you agree that your contributions will be licensed under its MIT license.

### Pull Request Checklist

- is the code tested?
  - `npm run test`
  - `npm run test:watch` if you want to continuously watch and run test on file change.
- is the code linted?
  - `npm run lint`
- is the code formatted?
  - `npm run format`
- is it a new package?
  - if yes, you'll need to add it to `configs/builds.js` in order for it to be bundled.
  - you can choose between `rollup` (node modules) and `webpack` (umd, browser).

Please **do not** bump the version and tag your pull request
with a v\[number\] as it corresponds to a release.

### Thank You

Thank you for any contributions!
