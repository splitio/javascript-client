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
              'targets': {
                'ie': '10',
                'node': '6'
              }
            }]],
            plugins: [
              '@babel/plugin-transform-runtime'
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
