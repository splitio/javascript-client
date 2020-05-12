import tape from 'tape';
import fetchMock from '../../../__tests__/utils/fetchMock';
import authenticate from '../../AuthClient';
import SettingsFactory from '../../../utils/settings/index';
import { authDataResponseSample, authDataSample } from '../mocks/dataMocks';

const settings = SettingsFactory({
  core: {
    authorizationKey: 'SDK_KEY',
  },
});

tape('authenticate', t => {

  t.test('success in node (200)', assert => {

    fetchMock.getOnce(settings.url('/auth'), (url, opts) => {
      assert.equal(opts.headers['Authorization'], `Bearer ${settings.core.authorizationKey}`,
        'auth request must contain Authorization header with config authorizationKey');
      return { status: 200, body: authDataResponseSample };
    });

    authenticate(settings).then(data => {
      assert.deepEqual(data, authDataSample,
        'if success, authorization must return data with token and decoded token');
      assert.end();
    }).catch(error => {
      assert.fail(error);
    });

  });

  t.test('success in browser (200)', assert => {

    const userKeys = ['emi@split.io', 'maldo@split.io'];

    fetchMock.getOnce(settings.url('/auth?users=emi%40split.io&users=maldo%40split.io'), (url, opts) => {
      assert.equal(opts.headers['Authorization'], `Bearer ${settings.core.authorizationKey}`,
        'auth request must contain Authorization header with config authorizationKey');
      return { status: 200, body: authDataResponseSample };
    });

    authenticate(settings, userKeys).then(data => {
      assert.deepEqual(data, authDataSample,
        'if success, authorization must return data with token and decoded token');
      assert.end();
    }).catch(error => {
      assert.fail(error);
    });

  });

  t.test('bad request in browser due to no user keys (400)', assert => {

    fetchMock.getOnce(settings.url('/auth'), () => {
      return { status: 400, body: '"no user specified"' };
    });

    authenticate(settings, []).then(() => {
      assert.fail('if bad request, promise is rejected');
    }).catch(error => {
      assert.equal(error.statusCode, 400,
        'if bad request, status code is 400');
      assert.end();
    });

  });

  t.test('Invalid credentials (401)', assert => {

    fetchMock.getOnce(settings.url('/auth'), () => {
      return { status: 401, body: '"Invalid credentials"' };
    });

    authenticate(settings, []).then(() => {
      assert.fail('if invalid credential, promise is rejected');
    }).catch(error => {
      assert.equal(error.statusCode, 401,
        'if invalid credential, status code is 401');
      assert.end();
    });

  });

  t.test('HTTP error (other than 401)', assert => {

    const NOT_OK_STATUS_CODE = 500;

    fetchMock.getOnce(settings.url('/auth'), () => {
      return { status: NOT_OK_STATUS_CODE, body: 'some error message' };
    });

    authenticate(settings, []).then(() => {
      assert.fail('if an HTTP error, promise is rejected');
    }).catch(error => {
      assert.equal(error.statusCode, NOT_OK_STATUS_CODE,
        'if an HTTP error, status code is the HTTP status code');
      assert.end();
    });

  });

  t.test('Network error (e.g., timeout)', assert => {

    fetchMock.getOnce(settings.url('/auth'), { throws: new TypeError('Network error') });

    authenticate(settings, []).then(() => {
      assert.fail('if network error, promise is rejected');
    }).catch(error => {
      assert.equal(error.statusCode, 'NO_STATUS',
        'if network error, status code is "NO_STATUS"');
      assert.end();
    });

  });

});
