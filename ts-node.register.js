/**
 * Run tests and scripts in Node while transpiling typescript files from `@splitsoftware/splitio-commons/src`
 * https://www.npmjs.com/package/ts-node
 *
 * NOTE: can be used with `npm link @splitsoftware/splitio-commons` or `"@splitsoftware/splitio-commons": "file:../javascript-commons" without extra steps
*/
require('ts-node').register({
  transpileOnly: true, // https://www.npmjs.com/package/ts-node#make-it-fast
  ignore: ['(?:^|/)node_modules/(?!@splitsoftware)'], // ignore transpiling node_modules except @splitsoftware (`ts-node` ignores node_modules by default)
  compilerOptions: {
    module: 'commonjs', // https://www.npmjs.com/package/ts-node#commonjs-vs-native-ecmascript-modules
  }
});
