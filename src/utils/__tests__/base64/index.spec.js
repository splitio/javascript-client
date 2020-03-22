/**
 * TODO
 *  - test 'encodeToBase64' and 'decodeFromBase64'
 *    - in browser (atob/btoa)
 *    - in others (neither browser nor node)
 */

import tape from 'tape';
import { base64sample, decodedBase64sample } from '../../../sync/__tests__/mocks/dataMocks';

import { encodeToBase64, decodeFromBase64 } from '../../base64';

tape('encodeToBase64', assert => {

  assert.deepEqual(encodeToBase64(decodedBase64sample), base64sample, 'encodes string to base64');
  assert.end();

});

tape('decodeFromBase64', assert => {

  assert.deepEqual(decodeFromBase64(base64sample), decodedBase64sample, 'decodes base64 string');
  assert.end();

});
