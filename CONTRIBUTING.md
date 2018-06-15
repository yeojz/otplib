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

### Code organization

- This project uses 2 primary branches: `master` and `gh-pages`.
  - Publishing to `gh-pages` is mostly handled by the CI system.
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

This project is published on `npm`, under 2 tags: `latest` and `next`.

`latest` contains **stable builds** while `next` contains **pre-release**.
End-users can install latest stable using `npm install otplib` and
pre-releases using `npm install otplib@next`

All releases are handled via the CI system.

### License

By contributing to `otplib`, you agree that your contributions will be licensed under its MIT license.

### Pull Request Checklist

- is the code linted?
  - `npm run lint:js`
- is the code formatted nicely?
  - `npm run lint:format`
- is the code tested?
  - `npm run test`
  - `npm run test:watch` if you want to continuously watch and run test on file change.
- are there any changes in method signature?
  - `.d.ts` files were introduced in `v10.0.0`, and can be found in `packages/types-ts`.
  - updating these type definition files is highly recommended, but can be in separate PRs
  - `npm run build && npm run lint:ts`

Please **do not** bump the version and tag your pull request
with a v\[number\] as it corresponds to a release.

### Thank You

Thank you for any contributions!
