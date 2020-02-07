/**
 * - Config options tests:
 *  - if config.integrations.ga2split is undefined or false, 
 *    then do not provide `splitTracker`.
 *  - if config.integrations.ga2split is true or an object without identities ...
 *   - and not identities provided as plugin options ...
 *    - and config.core.trafficType is defined, 
 *      then provide `splitTracker` and check identities have a single identity
 *    - and config.core.trafficType is undefined, 
 *      then not provide `splitTracker` and log error
 *   - and invalid identities provided as plugin options,
 *      then not provide `splitTracker` and log error
 *   - and valid identities provided as plugin options, 
 *      then provide `splitTracker` and check identities are the plugin identities
 *  - if config.integrations.ga2split is an object with identities
 *   - and valid identities provided as plugin options,
 *      then provide `splitTracker` and check identities are the SDK config identities
 */

import tape from 'tape-catch';
import sinon from 'sinon';

const splitTrackerModuleMock = {
  providePlugin: sinon.spy(),
  sdkOptions: {},
  splitTracker: sinon.spy(),
};

import proxyquire from 'proxyquire';
const proxyquireStrict = proxyquire.noCallThru();
const SplitFactory = proxyquireStrict('../../../index.js',
  { './integrations/ga/splitTracker': splitTrackerModuleMock }).SplitFactory;

// const errorLogSpy = sinon.spy(console, 'error');

function resetStubs() {
  splitTrackerModuleMock.providePlugin.resetHistory();
  splitTrackerModuleMock.sdkOptions = {};
  splitTrackerModuleMock.splitTracker.resetHistory();
}

const baseConfig = {
  core: {
    key: 'emiliano@split.io',
    authorizationKey: 'localhost',
  }
};

const baseConfigWithTT = {
  core: {
    key: 'emiliano@split.io',
    trafficType: 'user',
    authorizationKey: 'localhost',
  }
};

tape('if config.integrations.ga2split is not provided, then do not provide `splitTracker`', function (assert) {
  const config = Object.assign({}, baseConfig);

  // eslint-disable-next-line no-unused-vars
  const factory = SplitFactory(config);
  factory.client().destroy();

  assert.ok(splitTrackerModuleMock.providePlugin.notCalled);

  resetStubs();
  assert.end();
});

tape('if config.integrations.ga2split is true and config.core.trafficType is defined, then provide `splitTracker`', function (assert) {
  const config = Object.assign({}, baseConfigWithTT, {
    integrations: {
      type: 'GA_TO_SPLIT',
    }
  });

  // eslint-disable-next-line no-unused-vars
  const factory = SplitFactory(config);
  factory.client().destroy();

  assert.ok(splitTrackerModuleMock.providePlugin.calledOnce);

  resetStubs();
  assert.end();
});

// @TODO we must provide `splitTracker` even if the config is invalid
tape('if config.integrations.ga2split is true and config.core.trafficType is undefined, then do not provide `splitTracker` and log error', function (assert) {
  const config = Object.assign({}, baseConfig, {
    integrations: {
      type: 'GA_TO_SPLIT',
    },
  });

  // eslint-disable-next-line no-unused-vars
  const factory = SplitFactory(config);
  factory.client().destroy();

  assert.ok(splitTrackerModuleMock.providePlugin.notCalled);

  resetStubs();
  assert.end();
});