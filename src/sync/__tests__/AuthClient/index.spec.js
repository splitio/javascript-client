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

  t.test('success in node (200)', assert => {

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

  t.test('success in browser (200)', assert => {

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

  t.test('bad request in browser due to no user keys (400)', assert => {

    mock.onGet(settings.url('/auth')).replyOnce(() => {
      return [400, '"no user specified"'];
    });

    authenticate(settings, {}).then(() => {
      assert.fail('if bad request, promise is rejected');
    }).catch(error => {
      assert.equal(error.statusCode, 400,
        'if bad request, status code is 400');
    });

    assert.end();
  });

  t.test('Invalid credentials (401)', assert => {

    mock.onGet(settings.url('/auth')).replyOnce(() => {
      return [401, '"Invalid credentials"'];
    });

    authenticate(settings, {}).then(() => {
      assert.fail('if invalid credential, promise is rejected');
    }).catch(error => {
      assert.equal(error.statusCode, 401,
        'if invalid credential, status code is 401');
    });

    assert.end();
  });

  t.test('HTTP error (other than 401)', assert => {

    const NOT_OK_STATUS_CODE = 500;

    mock.onGet(settings.url('/auth')).replyOnce(() => {
      return [NOT_OK_STATUS_CODE, 'some error message'];
    });

    authenticate(settings, {}).then(() => {
      assert.fail('if an HTTP error, promise is rejected');
    }).catch(error => {
      assert.equal(error.statusCode, NOT_OK_STATUS_CODE,
        'if an HTTP error, status code is the HTTP status code');
    });

    assert.end();
  });

  t.test('Network error (e.g., timeout)', assert => {

    mock.onGet(settings.url('/auth')).networkErrorOnce();

    authenticate(settings, {}).then(() => {
      assert.fail('if network error, promise is rejected');
    }).catch(error => {
      assert.equal(error.statusCode, 'NO_STATUS',
        'if network error, status code is "NO_STATUS"');
    });

    mock.onGet(settings.url('/auth')).timeoutOnce();

    authenticate(settings, {}).then(() => {
      assert.fail('if timeout error, promise is rejected');
    }).catch(error => {
      assert.equal(error.statusCode, 'NO_STATUS',
        'if timeout error, status code is "NO_STATUS"');
    });

    assert.end();
  });

});
