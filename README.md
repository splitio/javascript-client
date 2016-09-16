# Split SDK for JavaScript

Split SDK is the library you should use for integrate [Split](http://split.io/)
into your web platform.

### How to install

Using [npm](https://www.npmjs.com/):

    $ npm install --save @splitsoftware/splitio

Then with a module bundler like [webpack](https://webpack.github.io/) that supports
either **CommonJS** or **ES2015** modules, use as you would anything else:

```js
// using an ES6 transpiler, like babel
import splitio from '@splitsoftware/splitio';

// not using an ES6 transpiler
var splitio = require('@splitsoftware/splitio');
```

Using [bower](https://bower.io):

    $ bower install splitio=https://cdn.split.io/split-7.0.0.min.js

And finally, the **UMD** build is also available in our **CDN**:

```html
<script src="//cdn.split.io/split-7.0.0.min.js"></script>
```

You can find the library on `window.splitio`.

### Usage documentation
- [Getting stared](http://docs.split.io/docs/getting-started)
- [JS SDK overview](http://docs.split.io/docs/javascript-sdk-overview)

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

1. Use `npm publish --tag canary` => release canary version.
1. Use `npm publish`              => release the stable version.

#### Building

1. `npm run build`     => ES5 versions of the code.
1. `npm run build-umd` => UMD version of the code (development).
1. `npm run build-min` => UMD version of the code but minified.

### CI

> use latest LTS version of NodeJS

`nvm install v4`

`nvm use v4`

> Upgrade to latest npm

`npm install -g npm@latest`

> Install dependencies

`npm install`

> Add binaries to the PATH

`export PATH=$(npm bin):$PATH`

> Add localhost file for tests!!!

`printf "%s\n" '# this a comment' 'my_new_feature on' '# another comment' > $HOME/.split`

> For SonarQ since the plugin is in Java 8

`jdk_switcher use oraclejdk8`

> Tests steps

`npm run lint`

`npm run test-browser-ci`

`npm run test-browser-e2e-ci`

`npm run test-node`
