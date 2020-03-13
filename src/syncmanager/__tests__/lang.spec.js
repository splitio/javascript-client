/**
 * TODO
 *  - test 'encodeToBase64' and 'decodeFromBase64'
 *    - in browser (atob/btoa)
 *    - in others
 */

import tape from 'tape';
import { jwtSample, decodedJwtPayloadSample, base64sample, decodedBase64sample } from './mocks/jwt';

import { encodeToBase64, decodeFromBase64, decodeJWTtoken } from '../../utils/lang';

tape('encodeToBase64', assert => {

  assert.deepEqual(encodeToBase64(decodedBase64sample), base64sample, 'encodes string to base64');
  assert.end();

});

tape('decodeFromBase64', assert => {

  assert.deepEqual(decodeFromBase64(base64sample), decodedBase64sample, 'decodes base64 string');
  assert.end();

});

tape('decodeJWTtoken', assert => {

  assert.deepEqual(decodeJWTtoken(jwtSample), decodedJwtPayloadSample, 'decodes JWT token');
  assert.end();

});
