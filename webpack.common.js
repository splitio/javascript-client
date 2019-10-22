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
              'modules': 'commonjs',
              'corejs': '3',
              'targets': {
                'ie': '10',
                'node': '4'
              },
            }]],
            plugins: [
              [
                '@babel/plugin-transform-runtime',
                {
                  'absoluteRuntime': false,
                  'corejs': 3,
                  'regenerator': true,
                  'useESModules': false
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
