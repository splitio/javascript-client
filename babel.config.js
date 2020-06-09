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
        'useBuiltIns': false,
        'modules': 'commonjs',
        'targets': {
          'ie': '10',
          'node': '6'
        }
      }]);
      plugins.push(['@babel/transform-runtime', {
        'useESModules': false,
        'corejs': 3
      }]);
      break;
    case 'karmatest':
    case 'umd': // umd build
      presets.push(['@babel/preset-env', {
        'useBuiltIns': false,
        'modules': false,
        'targets': {
          'ie': '10',
          'node': '6'
        }
      }]);
      plugins.push(
        [
          '@babel/plugin-transform-runtime',
          {
            'useESModules': true,
            'corejs': 3,
          }
        ]);
      break;
    default: // es6 build
      presets.push(['@babel/preset-env', {
        'modules': false
      }]);
      plugins.push(
        '@babel/plugin-proposal-object-rest-spread',
        ['@babel/transform-runtime', {
          'useESModules': true,
          'corejs': 3
        }]
      );
      break;
  }

  return {
    presets, plugins
  };
};
