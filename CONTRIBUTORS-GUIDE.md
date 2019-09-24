# Contributing to the Split JavaScript SDK

Split SDK is an open source project and we welcome feedback and contribution. Find below information about how to build the project with your changes, how to run the tests and how to send the PR.

## Development
 
### Development process
 
1. Fork the repository and create a topic branch from `development` branch. Please use a descriptive name for your branch.
2. While developing, use descriptive messages in your commits. Avoid short or meaningless sentences like: "fix bug".
3. Make sure to add tests for both positive and negative cases.
4. Run the linter script of the project (`npm run lint`) and fix any issues you find.
5. Run the build script and make sure it runs with no errors.
6. Run all tests and make sure there are no failures.
7. `git push` your changes to GitHub within your topic branch.
8. Open a Pull Request(PR) from your fork repo and into the `development` branch of the original repository.
9. When creating your PR, please fill up all the fields of the PR template if applicable for the project.
10. Check for conflicts once the pull request is created to make sure your PR can be merged cleanly into `development`.
11. Keep an eye for any feedback or comments from our SDK team.
 
### Building the SDK

For widespread use of the SDK, we like it to be compatible in different environments and module formats, such as **UMD** for standard HTML scripts, **CommonJS** for Node.js, and **ES2015** modules.

The different builts of the library can be generated at once with the command `npm run rebuild`. Refer to [package.json](package.json) for additional build scripts.

### Running tests

The project includes unit, integration and E2E tests for both browsers and Node.js environments.

The main testing scripts can be executed with the commands `npm run browser-test-suite` and `npm run node-test-suite`. Refer to [package.json](package.json) for additional testing scripts.
 
### Linting and other useful checks

Consider running the linter script (`npm run lint`) before pushing your changes.

Also, if applicable, update the TypeScript definition files and run its tests (`npm run test-ts-decls`).
 
# Contact
 
If you have any other questions or need to contact us directly in a private manner send us a note at sdks@split.io
