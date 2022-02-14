module.exports = {
  entry: {
    split: ['./es/umd.js']
  },

  output: {
    path: __dirname + '/umd',
    library: 'splitio',
    libraryTarget: 'umd',
    libraryExport: 'default'
  },
  devtool: false, // Remove source mapping. 'eval' is used by default in Webpack 5
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [['@babel/preset-env', {
              'useBuiltIns': false, // default value: don't add core-js or babel polyfills
              'targets': {
                'ie': '10',
                'node': '6'
              },
              'loose': true
            }]],
            plugins: [['@babel/plugin-transform-runtime', {
              // default values
              'absoluteRuntime': false,
              'corejs': false,
              'regenerator': true,
              'useESModules': false,
              'helpers': true,
            }]]
          }
        }
      }
    ]
  },

  node: false, // Not include Node polyfills, https://webpack.js.org/configuration/node
  target: ['web', 'es5'], // target 'es5', since 'es2015' is the default in Webpack 5
};
