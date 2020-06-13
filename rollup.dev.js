import config from './rollup.common';
import pkg from './package.json';

const VERSION = pkg.version;

config.output.file = `umd/split-${VERSION}.js`;

export default config;
