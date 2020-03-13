/**
 * TODO
 *  - test 'encodeToBase64' and 'decodeFromBase64'
 *    - in browser (atob/btoa)
 *    - in others
 */

import tape from 'tape';
import authenticate from '../authclient';

tape('authenticate', t => {

  t.test('authenticate ', assert => {

    authenticate;
    assert.end();
  });

});
