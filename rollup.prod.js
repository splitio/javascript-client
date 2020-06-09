import config from './rollup.common';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

const VERSION = pkg.version;

config.output.file = `umd/split-${VERSION}.min.js`;
config.output.sourcemap = true;
config.plugins.push(terser());

export default config;
