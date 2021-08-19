import tape from 'tape';
import { hash64 } from '../../../engine/engine/murmur3/murmur3_64';
import { keyListDataGzip, keyListData, bitmapDataGzip, bitmapData } from '../mocks/dataMocks';

import { parseKeyList, parseBitmap, isInBitmap } from '../../PushManager/mySegmentsV2utils';

tape('parseKeyList with GZIP', assert => {

  assert.deepEqual(parseKeyList(keyListDataGzip, 1), keyListData, 'decompress Gzipped KeyList');
  assert.end();

});

tape('gzipBitmap', assert => {
  const actualBitmap = parseBitmap(bitmapDataGzip, 1);
  assert.deepEqual(actualBitmap, bitmapData, 'decompress Gzipped Bitmap');

  const userKeysTrue = [
    '88f8b33b-f858-4aea-bea2-a5f066bab3ce',
    '603516ce-1243-400b-b919-0dce5d8aecfd',
    '4588c4f6-3d18-452a-bc4a-47d7abfd23df',
    '42bcfe02-d268-472f-8ed5-e6341c33b4f7',
    '4b0b0467-3fe1-43d1-a3d5-937c0a5473b1',
    '2a7cae0e-85a2-443e-9d7c-7157b7c5960a',
    '18c936ad-0cd2-490d-8663-03eaa23a5ef1',
    '09025e90-d396-433a-9292-acef23cf0ad1',
    'bfd4a824-0cde-4f11-9700-2b4c5ad6f719',
    '2b79d5df-b65a-d25d-75d7-05877f69d976',
    '375903c8-6f62-4272-88f1-f8bcd304c7ae'
  ];

  userKeysTrue.forEach(userKey => {
    const hash = hash64(userKey);
    assert.true(isInBitmap(actualBitmap, hash.hex));
  });

  const userKeysFalse = [
    '88f8b33b-f858-4aea-bea2-a5f066bab3c0',
    '603516ce-1243-400b-b919-0dce5d8aecf0',
    '4588c4f6-3d18-452a-bc4a-47d7abfd23d0',
    '42bcfe02-d268-472f-8ed5-e6341c33b4fc',
    '4b0b0467-3fe1-43d1-a3d5-937c0a5473b5',
    '2a7cae0e-85a2-443e-9d7c-7157b7c59606',
    '18c936ad-0cd2-490d-8663-03eaa23a5ef0',
    '09025e90-d396-433a-9292-acef23cf0ad0',
    'bfd4a824-0cde-4f11-9700-2b4c5ad6f710',
    '2b79d5df-b65a-d25d-75d7-05877f69d970',
    '375903c8-6f62-4272-88f1-f8bcd304c7a1'
  ];

  userKeysFalse.forEach(userKey => {
    const hash = hash64(userKey);
    assert.false(isInBitmap(actualBitmap, hash.hex));
  });

  assert.end();

});
