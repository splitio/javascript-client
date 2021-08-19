import tape from 'tape';
import { hash64 } from '../../../engine/engine/murmur3/murmur3_64';
import { keylists, bitmaps } from '../mocks/dataMocks';

import { parseKeyList, parseBitmap, isInBitmap } from '../../PushManager/mySegmentsV2utils';
import { _Set } from '../../../../lib/utils/lang/Sets';

tape('parseKeyList', assert => {
  keylists.forEach(keylist => {
    const { compression, keyListData, keyListDataCompressed, addedUserKeys, removedUserKeys, otherUserKeys } = keylist;

    assert.deepEqual(parseKeyList(keyListDataCompressed, compression), keyListData, 'decompress KeyList');

    const added = new _Set(keyListData.a);
    const removed = new _Set(keyListData.r);

    addedUserKeys.forEach(userKey => {
      const hash = hash64(userKey);
      assert.true(added.has(hash.dec), 'key hash belongs to added list');
      assert.false(removed.has(hash.dec), 'key hash doesn\'t belong to removed list');
    });

    removedUserKeys.forEach(userKey => {
      const hash = hash64(userKey);
      assert.false(added.has(hash.dec), 'key hash doesn\'t belong to added list');
      assert.true(removed.has(hash.dec), 'key hash belongs to removed list');
    });

    otherUserKeys.forEach(userKey => {
      const hash = hash64(userKey);
      assert.false(added.has(hash.dec), 'key hash doesn\'t belong to added list');
      assert.false(removed.has(hash.dec), 'key hash doesn\'t belong to removed list');
    });
  });

  assert.end();
});

tape('parseBitmap & isInBitmap', assert => {
  bitmaps.forEach(bitmap => {
    const { compression, bitmapData, bitmapDataCompressed, trueUserKeys, falseUserKeys } = bitmap;

    const actualBitmap = parseBitmap(bitmapDataCompressed, compression);
    if (bitmapData) assert.deepEqual(actualBitmap, bitmapData, 'decompress Bitmap');

    trueUserKeys.forEach(userKey => {
      const hash = hash64(userKey);
      assert.true(isInBitmap(actualBitmap, hash.hex), 'key hash belongs to Bitmap');
    });

    falseUserKeys.forEach(userKey => {
      const hash = hash64(userKey);
      assert.false(isInBitmap(actualBitmap, hash.hex), 'key hash doesn\'t belong to Bitmap');
    });
  });

  assert.end();
});
