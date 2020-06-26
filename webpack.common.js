module.exports = {
  entry: {
    split: ['./src/umd']
  },

  output: {
    path: __dirname + '/umd',
    library: 'splitio',
    libraryTarget: 'umd',
    libraryExport: 'default'
  },
  devtool: 'none',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [['@babel/preset-env', {
              'useBuiltIns': 'usage',
              'corejs': '3',
              'targets': {
                'ie': '10',
                'node': '6'
              },
              exclude: [
                'es.promise'
              ]
            }]],
            plugins: [
              [
                '@babel/plugin-transform-runtime',
                {
                  'absoluteRuntime': false,
                  'regenerator': true,
                  'useESModules': false,
                  'helpers': true,
                }
              ]
            ]
          }
        }
      }
    ]
  },

  node: {
    fs: 'empty',
    module: 'empty',
    console: false
  }
};
