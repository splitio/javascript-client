import tape from 'tape';
import MockAdapter from 'axios-mock-adapter';
import authenticate from '../../AuthClient';
import SettingsFactory from '../../../utils/settings/index';
import { __getAxiosInstance } from '../../../services/transport';
import { authDataResponseSample, authDataSample } from '../mocks/dataMocks';

const mock = new MockAdapter(__getAxiosInstance());

const settings = SettingsFactory({
  core: {
    authorizationKey: 'SDK_KEY',
  },
});

tape('authenticate', t => {

  t.test('success in node (no user keys)', assert => {

    const userKeys = {};

    mock.onGet(settings.url('/auth')).replyOnce(req => {
      assert.equal(req.headers['Authorization'], `Bearer ${settings.core.authorizationKey}`,
        'auth request must contain Authorization header with config authorizationKey');
      return [200, authDataResponseSample];
    });

    authenticate(settings, userKeys).then(data => {
      assert.deepEqual(data, authDataSample,
        'if success, authorization must return data with token and decoded token');
    }).catch(error => {
      assert.fail(error);
    });

    assert.end();
  });

  t.test('success in browser (with user keys)', assert => {

    const userKeys = { ['emi@split.io']: 'emihash', ['maldo@split.io']: 'maldohash' };

    mock.onGet(settings.url('/auth?users=emi%40split.io&users=maldo%40split.io')).replyOnce(req => {
      assert.equal(req.headers['Authorization'], `Bearer ${settings.core.authorizationKey}`,
        'auth request must contain Authorization header with config authorizationKey');
      return [200, authDataResponseSample];
    });

    authenticate(settings, userKeys).then(data => {
      assert.deepEqual(data, authDataSample,
        'if success, authorization must return data with token and decoded token');
    }).catch(error => {
      assert.fail(error);
    });

    assert.end();
  });

  t.test('Invalid credentials', assert => {

    mock.onGet(settings.url('/auth')).replyOnce(() => {
      return [401, '"Invalid credentials"'];
    });

    authenticate(settings, {}).then(() => {
      assert.fail('if invalid credential, promise is rejected');
    }).catch(error => {
      assert.equal(error.statusCode, 401,
        'if invalid credential, status code is 401');
      assert.equal(error.message, 'Split Network Error',
        'if invalid credential, error message is "Split Network Error"');
    });

    assert.end();
  });

});
