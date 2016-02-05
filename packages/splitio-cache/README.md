# SPLIT Cache

This module is responsible for retrieve and store the information required
for evaluate keys and features.

## Development dependency

We use `gcp` command to copy some files preserving directories. If you are
running on **OSX**, please run:

> `brew install coreutils`

## Commands

### `npm run build`

The implementation of the cache was made using ES6, so in order to provide an
easy way to run the code, we are transpiling to ES5. If you have an environment
which provides some ES6 features, please do not hesitate un customize the
building tuning the `babel` settings present in `package.json`.

Reference: https://www.npmjs.com/package/babel-preset-node5

### `npm run watch` && `npm run watch-test`

After run `npm run build` you could continue editing your code but needs
monitoring tools to transpile on each file change. In order to allow this, just
run the commands in a console.

### `npm test` && `npm test --coverage`

Having all the files transpiled, you could run the test suite to see if
everything correctly works.

We are using [tape](https://github.com/substack/tape) for writing test suites,
and [browserify](https://www.npmjs.com/package/browserify) to transform the code
to be run inside the browser.

For coverage, we are using [istanbul](https://gotwarlost.github.io/istanbul/),
and it part of the test command. If you want to see the report: `npm test --coverage`
