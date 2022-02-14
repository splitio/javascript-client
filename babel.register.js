/**
 * run @babel/register but configured to transpile typescript files from `@splitsoftware/splitio-commons/src`
 * https://babeljs.io/docs/en/babel-register
 *
 * NOTE: to use with `npm link @splitsoftware/splitio-commons` or `"@splitsoftware/splitio-commons": "file:../javascript-commons",
 * - either run `npm install -save-dev @babel/runtime` in javascript-commons.
 * - or run `npm link ../javascript-client/node_modules/@babel/runtime` in javascript-commons, assuming that repos are siblings.
*/
require('@babel/register')({
  extensions: ['.js', '.ts'], // `babel` doesn't consider .ts files by default
  ignore: [/node_modules[/](?!@splitsoftware)/], // ignore transpiling node_modules except @splitsoftware (`@babel/register` ignores node_modules by default)
});
