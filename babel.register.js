/**
 * run @babel/register but configured to transpile typescript files from `@splitsoftware/splitio-commons/src`
 * https://babeljs.io/docs/en/babel-register
 *
 * NOTE: to use with `npm link @splitsoftware/splitio-commons` or `"@splitsoftware/splitio-commons": "file:../javascript-commons",
 * you need to run `npm install -save-dev @babel/runtime` in JS-commons.
*/
require('@babel/register')({
  extensions: ['.js', '.ts'], // `babel` doesn't consider .ts files by default
  ignore: [/node_modules[/](?!@splitsoftware)/], // ignore transpiling node_modules except @splitsoftware (`@babel/register` ignores node_modules by default)
});
