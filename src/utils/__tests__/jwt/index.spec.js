/**
 * TODO
 *  - test 'encodeToBase64' and 'decodeFromBase64'
 *    - in browser (atob/btoa)
 *    - in others (neither browser and node)
 */

import tape from 'tape';
import { jwtSample, decodedJwtPayloadSample, userKeySample, userKeyBase64HashSample } from '../../../sync/__tests__/mocks/dataMocks';

import { decodeJWTtoken } from '../../jwt';
import { hashUserKey } from '../../jwt/hashUserKey';

tape('decodeJWTtoken', assert => {

  assert.deepEqual(decodeJWTtoken(jwtSample), decodedJwtPayloadSample, 'decodes JWT token');
  assert.end();

});

tape('hashUserKey', assert => {

  assert.deepEqual(hashUserKey(userKeySample), userKeyBase64HashSample, 'hashes key and encodes to base64');
  assert.end();

});