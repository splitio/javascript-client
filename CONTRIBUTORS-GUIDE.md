# Contributing to the Split JavaScript SDK

Split SDK is an open source project and we welcome feedback and contribution. The information below describes how to build the project with your changes, run the tests, and send the Pull Request(PR).

## Development

### Development process

1. Fork the repository and create a topic branch from `development` branch. Please use a descriptive name for your branch.
2. Run `nvm use` to ensure that you are using the right npm and node version, and `npm install` to have the dependencies up to date.
3. While developing, use descriptive messages in your commits. Avoid short or meaningless sentences like: "fix bug".
4. Make sure to add tests for both positive and negative cases.
5. If your changes have any impact on the public API, make sure you update the TypeScript declarations as well as it's related test file.
6. Run the linter script of the project and fix any issues you find.
7. Run the build script and make sure it runs with no errors.
8. Run all tests and make sure there are no failures.
9. Run the TypeScript declarations tests and make sure it compiles correctly.
10. `git push` your changes to GitHub within your topic branch.
11. Open a Pull Request(PR) from your forked repo and into the `development` branch of the original repository.
12. When creating your PR, please fill out all the fields of the PR template, as applicable, for the project.
13. Check for conflicts once the pull request is created to make sure your PR can be merged cleanly into `development`.
14. Keep an eye out for any feedback or comments from Split's SDK team.

### Building the SDK

For widespread use of the SDK with different environments and module formats, we have three different builds:
* A bundled **UMD** file.
* A **ES2015** modules compatible build.
* A **CommonJS** modules compatible build.

The different builds can be generated all at once with the command `npm run build`. Refer to [package.json](package.json) for more insight on the build scripts.

### Running tests

The project includes unit as well as integration tests for both browser and Node.js environments.

All tests can be run at once with the command `npm run test`.

If you've updated the TypeScript declaration files (located in `/types` folder), you should add some lines verifying the updates in `/ts-tests/index.ts` and then run the TypeScript compilation test using the `npm run test-ts-decls` command.

For additional testing scripts or to get more insight on how these work, please refer to our [package.json](package.json) file.

### Linting and other useful checks

Consider running the linter script (`npm run check:lint`) and fixing any issues before pushing your changes.

If you want to debug your changes consuming it from a test application, you could:
- For browsers, import the **UMD** bundle from an HTML document. To debug you can use the browser dev tools.
- For Node, you could use symlinks via [npm link command](https://docs.npmjs.com/cli/link.html) and then import the package as usual. To debug you could use the [Node inspector](https://nodejs.org/en/docs/guides/debugging-getting-started/).

# Contact

If you have any other questions or need to contact us directly in a private manner send us a note at sdks@split.io