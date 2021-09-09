module.exports = function (api) {
  api.cache.using(() => process.env.NODE_ENV);

  const env = api.env();
  const presets = [];
  const plugins = [];

  switch (env) {
    case 'development':
    case 'cjs':
    case 'production':
    case 'test':
      presets.push(['@babel/preset-env', {
        'useBuiltIns': false, // default value: don't add core-js or babel polyfills
        'modules': 'commonjs', // transform ES6 module syntax to CJS.
        'targets': {
          'ie': '10',
          'node': '6'
        },
        'loose': true // produces simpler ES5 code
      }]);
      plugins.push(['@babel/plugin-transform-runtime', {
        'useESModules': false, // default value: use helpers that get run through @babel/plugin-transform-modules-commonjs
        'corejs': false // default value: use `@babel/runtime` that doesn't have built-in polyfills
      }]);
      break;

    default: // es6 build
      presets.push(['@babel/preset-env', {
        'useBuiltIns': false, // default value: don't add core-js or babel polyfills
        'modules': false, // dont' transform ES6 module syntax. required for tree-shaking with ES6 modules
        'targets': {
          'ie': '10',
          'node': '6'
        },
        'loose': true // produces simpler ES5 code
      }]);
      plugins.push(['@babel/plugin-transform-runtime', {
        'useESModules': true, // use helpers that not get run through @babel/plugin-transform-modules-commonjs
        'corejs': false // default value: use `@babel/runtime` that doesn't have built-in polyfills
      }]);
      break;
  }

  return {
    presets, plugins
  };
};
