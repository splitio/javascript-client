import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import babel from '@rollup/plugin-babel';

export default {
  input: 'src/umd.js',
  output: {
    format: 'umd', // `umd` works as `cjs`, `iife` and `amd` all in one
    name: 'splitio',  // umd format requires a name
  },
  plugins: [
    resolve({
      browser: true,
      // @TODO check preferBuiltins
      preferBuiltins: false,
    }),
    commonjs(),
    json(),
    babel({
      babelHelpers: 'runtime',
      // @ TODO check if we should exclude node_modules or not
      exclude: 'node_modules/**',
    }),
  ]
};
