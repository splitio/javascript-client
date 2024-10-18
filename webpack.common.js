module.exports = {
  entry: {
    split: ['./esm/umd.js']
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
        test: /\.(ts|js)$/,

        exclude: /node_modules/,
        use: {
          loader: 'ts-loader'
        }

        /*
        // Use next configuration to bundle from entry './src/umd.js'

        exclude: /node_modules[/](?!@splitsoftware)/, // Cannot exclude 'node_modules/@splitsoftware/splitio-commons/src', in order to process TS files
        use: {
          loader: 'ts-loader',
          options: { allowTsInNodeModules: true } // https://github.com/TypeStrong/ts-loader#allowtsinnodemodules
        }
        */
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  node: false, // Not include Node polyfills, https://webpack.js.org/configuration/node
  target: ['web', 'es5'], // target 'es5', since 'es2015' is the default in Webpack 5
};
