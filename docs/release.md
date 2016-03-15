## Release

### Building process (transpilation to ES5)

This step is required to run the tests, and each packages provides his own
`npm run build`. At root level we provide a `npm run build-all` which builds all
the packages in the correct order, so please, each time you want to release
a bundled version, remember to run `npm run build-all` at the root dir of the
repository.

### Checklist

Each package should pass:

1. `npm run lint` (it's available at root level).
2. `npm run test-all` (it's available at package level).
3. `npm run karma-local` in any package you have changed.
4. `npm run karma-sauce` in any package you have changed.

### NPM Publish

Once everything works :smile: you could continue with the official release of a
new version.

1. Following the SDK versioning spec, move the version forward of all the
   packages, doesn't matter if you have make changes or not.
2. You have 2 options, release an incremental canary version, in that case use
   `npm run canary-all`
3. If you want to officially release a stable version, please use
   `npm run release-all`
