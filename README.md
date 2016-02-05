# NodeJS and Browser SDK

## Technologies

- ES6 (generators are blacklisted).
- TAPE for unit tests.
- [MonoRepo approach](https://github.com/babel/babel/blob/development/doc/design/monorepo.md).
- As simple as possible.

## Development mode

In order to simplify the startup, please execute `npm run dev`. The script will
do all the necessary steps to:

1. Install dependencies.
2. Link packages to be used locally.
3. Try to prune any packages which is possible to be removed.

## Release process

We have 4 packages (for now) handling different parts of the system as isolated
as possible.

### Checklist

Each packages should pass:

1. `npm lint` (it's available at root level).
2. `npm test` (it's available at package level).
3. Demos should continue working each time we tag a version.

### Building process

This step is required to run the tests, and each packages provides his own
`npm run build`. At root level we provide a `npm run build` which builds all
the packages in the correct order, so please, each time you want to release
a bundled version, remember to run `npm run build` at the root dir of the
repository.

### NPM Publish

Once everything works, you could continue with the official release of a new
version, to help in the process, we are using a custom version of [lerna](https://github.com/kittens/lerna).

1. Go and update the 6 `package.json`s manually switching to the version you
will release. (This will change in a near future).
2. `lerna publish`

### How to install the custom version of lerna

1. `nvm use 4.2.4` (this version matches with the current version used for development).
2. `git clone ?` (I deleted the repo => update this once I push it again).
3. `npm link` inside the directory where you cloned the custom version of lerna.
4. `lerna --version` should show 2.0.0.
