import config from './rollup.common';
import pkg from './package.json';

const VERSION = pkg.version;

export default env => {
  config.output.file = `umd/split${env.branch !== 'master' ? `-dev-${env.commit_hash}` : `-${VERSION}`}.js`;
  return config;
};