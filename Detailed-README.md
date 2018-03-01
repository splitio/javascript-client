# Split SDK for JavaScript

Split SDK is the library you should use for integrate [Split](http://split.io/)
into your web platform.


### How to install

Using [npm](https://www.npmjs.com/):

    $ npm install --save @splitsoftware/splitio

Then with a module bundler like [webpack](https://webpack.github.io/) that supports
either **CommonJS** or **ES2015** modules, use as you would anything else:

JavaScript
```js
// using es modules
import { SplitFactory } from '@splitsoftware/splitio';

// using common js
const SplitFactory = require('@splitsoftware/splitio').SplitFactory;
```

TypeScript
```typescript
// using es modules
import { SplitFactory } from '@splitsoftware/splitio';

// using common js
import { SplitFactory } = require('@splitsoftware/splitio');
```

Using [bower](https://bower.io):

    $ bower install splitio=https://cdn.split.io/sdk/split-9.3.6.min.js

And finally, the **UMD** build is also available in our **CDN**:

```html
<script src="//cdn.split.io/sdk/split-9.3.6.min.js"></script>
```

You can find the library on `window.splitio`.

#### Migration v9 to v10

We migrated our source code to ESM and exposed
a new way to import our SDK to take
advantage of the ESM modules.

Before v10 we expose a function
```js
import splitio from '@splitsoftware/splitio';

const sdk = splitio(settings);
```

In V10 we expose an object with SplitFactory as a factory function to be consumed.
```js
import { SplitFactory } from '@splitsoftware/splitio';

const sdk = SplitFactory(settings);
```

For UMD build we continue exporting the same factory function

```html
<script src="//cdn.split.io/split-10.0.0.min.js"></script>
```

```js
const sdk = window.splitio(settings);

// or

const sdk = splitio(settings);
```

#### Migration v7 to v8

If you are comming from v7 and wants to use v8 without apply changes into your
code, we have provided a migration bundle which decorates the new API simulating
the old one:

In the browser you were probably using something like:

```html
<script src="//cdn.split.io/split-7.6.0.min.js"></script>
```

Now you should use:

```html
<script src="//cdn.split.io/sdk/split-migration-8.2.0.min.js"></script>
```

In CommonJS environments (even using ES6 modules), you should require/import:

```js
// using an ES6 transpiler, like babel
import splitio from '@splitsoftware/splitio/migration';

// not using an ES6 transpiler
const splitio = require('@splitsoftware/splitio/migration');
```


### Usage documentation
- [Getting stared](http://docs.split.io/docs/getting-started)
- [JS SDK overview](http://docs.split.io/docs/javascript-sdk-overview)
- [NodeJS SDK overview](http://docs.split.io/docs/nodejs-sdk-overview)


### Release documentation
- [Changes](CHANGES.txt)
- [News](NEWS.txt)


### How to release

#### Versioning

Update the package.json with the correct value using semver.

    1.0.0-canary.0 => First candidate to be fully verified.
    1.0.0-canary.1 => Second candidate to be fully verified.
    1.0.0-canary.2 => Third candidate to be fully verified.
    1.0.0          => Stable release

#### Publishing into NPM

1. Use `npm run canary`   => release canary version.
1. Use `npm run stable`   => release the stable version.

#### Building

1. `npm run build-es`   => ES5 version of the code with es modules.
1. `npm run build-cjs`  => ES5 version of the code with commonjs modules.
1. `npm run build-umd`  => UMD version of the code (development).
1. `npm run build-min`  => UMD version of the code but minified.
1. `npm run rebuild`    => All of the above (complete build).

### Updating Redis mocks for UT

For generating and consuming JSON files with Redis instances data, we use redis-dump package.

Requirements: Have a redis instance running with default config.

To regenerate the mock, run on the root of the project:
> ./node_modules/redis-dump/bin/cli/redis-dump --json > src/__tests__/mocks/redis_mock.json

Then just run the test (you need a redis instance running of course):
> npm run test-node-redis

### CI

> use latest LTS version of NodeJS

`nvm install v8`

`nvm use v8`

> Upgrade to latest npm

`npm install -g npm@latest`

> Install dependencies

`npm install`

> Add binaries to the PATH

`export PATH=$(npm bin):$PATH`

> Add localhost file for tests!!!

`printf "%s\n" '# this a comment' 'my_new_feature on' '# another comment' > $HOME/.split`

> Expose package globally for TypeScript validations

`npm link`

> Tests steps

`npm run test-ts-decls`

> TypeScript installation could affect the package so we unlink and install again to keep consistency with the dependencies

`npm unlink`

`npm run test-browser-ci`

`npm run test-browser-e2e-ci`

`npm run test-node`

`npm run test-node-redis`

`npm run rebuild`
