import config from './rollup.common';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

const VERSION = pkg.version;

export default env => {
  config.output.file = `umd/split${env.branch !== 'master' ? `-dev-${env.commit_hash}` : `-${VERSION}`}.min.js`;
  // @TODO include sourcemaps or not?
  // config.output.sourcemap = true;
  config.plugins.push(terser());
  return config;
};
