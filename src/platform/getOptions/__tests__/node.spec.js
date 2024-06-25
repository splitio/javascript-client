import tape from 'tape-catch';
import { settingsFactory } from '../../../settings/node';
import { getOptions } from '../node';

tape('getOptions returns an object with a custom agent if all urls are https', assert => {
  const settings = settingsFactory({});
  assert.true(typeof getOptions(settings).agent === 'object');

  assert.end();
});

tape('getOptions returns undefined if some url is not https', assert => {
  const settings = settingsFactory({ urls: { sdk: 'http://sdk.split.io' } });
  assert.equal(getOptions(settings), undefined);

  assert.end();
});

tape('getOptions returns the provided options from settings', assert => {
  const customRequestOptions = { agent: false };
  const settings = settingsFactory({ sync: { requestOptions: customRequestOptions } });
  assert.equal(getOptions(settings), customRequestOptions);

  assert.end();
});
