import tape from 'tape-catch';
import { defaults as nodeDefaults } from '../defaults/node';
import { defaults as browserDefaults } from '../defaults/browser';
import { version } from '../../../package.json';

tape('sdk version should contain the package.json version', (assert) => {
  assert.equal(nodeDefaults.version, `nodejs-${version}`);
  assert.equal(browserDefaults.version, `javascript-${version}`);
  assert.true(version.length <= 16); // SDK version must not exceed 16 chars length');

  assert.end();
});
