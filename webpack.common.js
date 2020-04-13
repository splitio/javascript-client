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
              'targets': '> 0.5%, last 2 versions, Firefox ESR, not dead, not IE >= 0',
              exclude: [
                'es.promise'
              ]
            }]],
            plugins: [
              [
                '@babel/plugin-transform-runtime',
                {
                  'absoluteRuntime': false,
                  'corejs': 3,
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
