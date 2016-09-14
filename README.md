# Split SDK for JavaScript

Split SDK is the library you should use for integrate [Split](http://split.io/)
into your web platform.

### Release documentation
- [Changes](./CHANGES.txt)
- [News](./NEWS.txt)

### Usage documentation
- [Getting stared](http://docs.split.io/docs/getting-started)
- [JS SDK overview](http://docs.split.io/docs/javascript-sdk-overview)

### How to release

#### Versioning

1. Update the package.json with the correct value using semver.
   1.0.0-canary.0 => First candidate to be fully verified.
   1.0.0-canary.1 => Second candidate to be fully verified.
   1.0.0-canary.2 => Third candidate to be fully verified.
   1.0.0          => Stable release

#### Publishing into NPM

1. Use `npm publish --tag canary` to release canary trials.
1. Use `npm publish` to release the stable version.

### CI

#### use latest LTS version of NodeJS
nvm install v4
nvm use v4
#### Upgrade to latest npm
npm install -g npm@latest
#### Install dependencies
npm install
#### Add binaries to the PATH
export PATH=$(npm bin):$PATH
#### Add localhost file for tests!!!
printf "%s\n" '# this a comment' 'my_new_feature on' '# another comment' > $HOME/.split
#### For SonarQ since the plugin is in Java 8
jdk_switcher use oraclejdk8
#### Tests steps
npm run lint
npm run test-browser-ci
npm run test-browser-e2e-ci
npm run test-node
