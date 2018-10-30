import tape from 'tape';
import Meta from '../Meta';

tape('META / Meta object creation', assert => {
  const fakeSettings = {
    version: 'test.version',
    runtime: {
      ip: 'test.ip',
      hostname: 'test.hostname'
    }
  };
  const meta = Meta(fakeSettings);

  assert.equal(meta.s, fakeSettings.version, 'SDK Version should be returned as the "s" property.');
  assert.equal(meta.i, fakeSettings.runtime.ip, 'SDK runtime IP should be returned as the "i" property.');
  assert.equal(meta.n, fakeSettings.runtime.hostname, 'SDK runtime hostname should be returned as the "n" property.');

  assert.true(meta !== Meta(fakeSettings), 'Should return a new object each time we call it.');

  assert.end();
});

