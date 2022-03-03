import tape from 'tape-catch';
import sinon from 'sinon';
import osFunction from 'os';
import ipFunction from 'ip';
import { settingsFactory } from '../node';
import { CONSUMER_MODE, NA } from '@splitsoftware/splitio-commons/src/utils/constants';

const IP_VALUE = ipFunction.address();
const HOSTNAME_VALUE = osFunction.hostname();

tape('SETTINGS / Redis options should be properly parsed', assert => {
  const settingsWithUrl = settingsFactory({
    core: {
      authorizationKey: 'dummy token'
    },
    mode: 'consumer',
    storage: {
      type: 'REDIS',
      options: {
        url: 'test_url',
        host: 'h', port: 'p', db: 'bla', pass: 'nope',
        randomProp: 'I will not be present',
        connectionTimeout: 11,
        operationTimeout: 22
      },
      prefix: 'test_prefix'
    }
  });
  const settingsWithoutUrl = settingsFactory({
    core: {
      authorizationKey: 'dummy token'
    },
    mode: 'consumer',
    storage: {
      type: 'REDIS',
      options: {
        host: 'host', port: 'port', pass: 'pass', db: 'db',
        randomProp: 'I will not be present',
        connectionTimeout: 33,
        operationTimeout: 44
      },
      prefix: 'test_prefix'
    }
  });

  assert.deepEqual(settingsWithUrl.storage, {
    type: 'REDIS', prefix: 'test_prefix', options: { url: 'test_url', connectionTimeout: 11, operationTimeout: 22 }
  }, 'Redis storage settings and options should be passed correctly, url settings takes precedence when we are pointing to Redis.');

  assert.deepEqual(settingsWithoutUrl.storage, {
    type: 'REDIS', prefix: 'test_prefix', options: { host: 'host', port: 'port', pass: 'pass', db: 'db', connectionTimeout: 33, operationTimeout: 44 }
  }, 'Redis storage settings and options should be passed correctly, url settings takes precedence when we are pointing to Redis.');

  assert.end();
});

tape('SETTINGS / IPAddressesEnabled should be overwritable and true by default', assert => {
  const settingsWithIPAddressDisabled = settingsFactory({
    core: {
      authorizationKey: 'dummy token',
      IPAddressesEnabled: false
    }
  });
  const settingsWithIPAddressEnabled = settingsFactory({
    core: {
      authorizationKey: 'dummy token'
    }
  });
  const settingsWithIPAddressDisabledAndConsumerMode = settingsFactory({
    core: {
      authorizationKey: 'dummy token',
      IPAddressesEnabled: false
    },
    mode: CONSUMER_MODE,
    storage: { type: 'REDIS' }
  });
  const settingsWithIPAddressEnabledAndConsumerMode = settingsFactory({
    core: {
      authorizationKey: 'dummy token'
    },
    mode: CONSUMER_MODE,
    storage: { type: 'REDIS' }
  });

  assert.equal(settingsWithIPAddressDisabled.core.IPAddressesEnabled, false, 'When creating a setting instance, it will have the provided value for IPAddressesEnabled');
  assert.equal(settingsWithIPAddressEnabled.core.IPAddressesEnabled, true, 'and if no IPAddressesEnabled was provided, it will be true.');

  assert.deepEqual({ ip: false, hostname: false }, settingsWithIPAddressDisabled.runtime, 'When IP address is disabled in standalone mode, the runtime setting properties (ip and hostname) have to be false, to avoid be added as request headers.');
  assert.deepEqual({ ip: NA, hostname: NA }, settingsWithIPAddressDisabledAndConsumerMode.runtime, 'When IP address is disabled in consumer mode, the runtime setting properties (ip and hostname) will have a value of "NA".');

  assert.deepEqual({ ip: IP_VALUE, hostname: HOSTNAME_VALUE }, settingsWithIPAddressEnabled.runtime, 'When IP address is enabled, the runtime setting will have the current ip and hostname values.');
  assert.deepEqual({ ip: IP_VALUE, hostname: HOSTNAME_VALUE }, settingsWithIPAddressEnabledAndConsumerMode.runtime, 'When IP address is enabled, the runtime setting will have the current ip and hostname values.');

  assert.end();
});

tape('SETTINGS / Throws exception if no "REDIS" storage is provided in consumer mode', (assert) => {
  const config = {
    core: {
      authorizationKey: 'dummy token'
    },
    mode: CONSUMER_MODE
  };

  assert.throws(() => {
    settingsFactory(config);
  }, /A REDIS storage is required on consumer mode/);
  assert.throws(() => {
    settingsFactory({
      ...config,
      storage: { type: 'invalid type' }
    });
  }, /A REDIS storage is required on consumer mode/);

  assert.end();
});

tape('SETTINGS / Log error and fallback to InMemory storage if no valid storage is provided in standlone and localhost modes', (assert) => {
  const logSpy = sinon.spy(console, 'log');


  const settings = [
    settingsFactory({
      core: { authorizationKey: 'localhost' }, // localhost mode
      storage: { type: 'REDIS' }, // 'REDIS' is not a valid storage for standalone and localhost modes
      debug: 'ERROR'
    }), settingsFactory({
      core: { authorizationKey: 'dummy token' }, // standalone mode
      storage: { type: 'INVALID' },
      debug: 'ERROR'
    })
  ];

  assert.deepEqual(logSpy.args, [
    ['[ERROR] splitio => The provided REDIS storage is invalid for this mode. It requires consumer mode. Fallbacking into default MEMORY storage.'],
    ['[ERROR] splitio => The provided \'INVALID\' storage type is invalid. Fallbacking into default MEMORY storage.']
  ], 'logs error message');

  settings.forEach(setting => { assert.equal(setting.storage.type, 'MEMORY', 'fallbacks to memory storage'); });

  logSpy.restore();
  assert.end();
});
