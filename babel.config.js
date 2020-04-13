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
        'useBuiltIns': 'usage',
        'modules': 'commonjs',
        'corejs': '3',
        'targets': '> 0.5%, last 2 versions, Firefox ESR, not dead, not IE >= 0, node > 6',
        exclude: [
          'es.promise'
        ]
      }]);
      plugins.push(['@babel/transform-runtime', {
        'useESModules': false,
        'corejs': 3
      }]);
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
