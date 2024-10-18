import sinon from 'sinon';
import { SplitFactory } from '../../';
import { splitFilters, queryStrings, groupedFilters } from '../mocks/fetchSpecificSplits';

const baseConfig = {
  core: {
    authorizationKey: '<fake-token-push-1>',
    key: 'nicolas@split.io'
  },
  scheduler: {
    featuresRefreshRate: 0.01
  },
  streamingEnabled: false,
};

export function fetchSpecificSplits(fetchMock, assert) {

  assert.plan(splitFilters.length);

  for (let i = 0; i < splitFilters.length; i++) {
    const urls = { sdk: 'https://sdkurl' + i };
    const config = { ...baseConfig, sync: { splitFilters: splitFilters[i] }, urls };

    if (groupedFilters[i]) { // tests where validateSplitFilters executes normally
      const queryString = queryStrings[i] || '';
      let factory;

      fetchMock.getOnce(urls.sdk + '/splitChanges?s=1.2&since=-1' + queryString, { status: 200, body: { splits: [], since: -1, till: 1457552620999 } });
      fetchMock.getOnce(urls.sdk + '/splitChanges?s=1.2&since=1457552620999' + queryString, { status: 200, body: { splits: [], since: 1457552620999, till: 1457552620999 } });
      fetchMock.getOnce(urls.sdk + '/splitChanges?s=1.2&since=1457552620999' + queryString, function () {
        factory.client().destroy().then(() => {
          assert.pass(`splitFilters #${i}`);
        });
        return { status: 200, body: { splits: [], since: 1457552620999, till: 1457552620999 } };
      });
      fetchMock.get(urls.sdk + '/memberships/nicolas%40split.io', { status: 200, body: { 'ms': {} } });

      factory = SplitFactory(config);

    } else { // tests where validateSplitFilters throws an exception
      try {
        SplitFactory(config);
      } catch (e) {
        assert.equal(e.message, queryStrings[i]);
      }
    }

  }
}

export function fetchSpecificSplitsForFlagSets(fetchMock, assert) {
  // Flag sets
  assert.test(async (t) => {

    const splitFilters = [{ type: 'bySet', values: ['set_x ', 'set_x', 'set_3', 'set_2', 'set_3', 'set_ww', 'invalid+', '_invalid', '4_valid'] }];
    const baseUrls = { sdk: 'https://sdk.baseurl' };

    const config = {
      ...baseConfig,
      urls: baseUrls,
      debug: 'WARN',
      sync: {
        splitFilters
      }
    };

    const logSpy = sinon.spy(console, 'log');

    let factory;
    const queryString = '&sets=4_valid,set_2,set_3,set_ww,set_x';
    fetchMock.get(baseUrls.sdk + '/memberships/nicolas%40split.io', { status: 200, body: { 'ms': {} } });

    fetchMock.getOnce(baseUrls.sdk + '/splitChanges?s=1.2&since=-1' + queryString, { status: 200, body: { splits: [], since: 1457552620999, till: 1457552620999 }});
    fetchMock.getOnce(baseUrls.sdk + '/splitChanges?s=1.2&since=1457552620999' + queryString, async function () {
      t.pass('flag set query correctly formed');
      t.true(logSpy.calledWithExactly('[WARN]  splitio => settings: bySet filter value "set_x " has extra whitespace, trimming.'));
      t.true(logSpy.calledWithExactly('[WARN]  splitio => settings: you passed invalid+, flag set must adhere to the regular expressions /^[a-z0-9][_a-z0-9]{0,49}$/. This means a flag set must start with a letter or number, be in lowercase, alphanumeric and have a max length of 50 characters. invalid+ was discarded.'));
      t.true(logSpy.calledWithExactly('[WARN]  splitio => settings: you passed _invalid, flag set must adhere to the regular expressions /^[a-z0-9][_a-z0-9]{0,49}$/. This means a flag set must start with a letter or number, be in lowercase, alphanumeric and have a max length of 50 characters. _invalid was discarded.'));
      logSpy.restore();
      factory.client().destroy().then(() => {
        t.end();
      });
    });
    factory = SplitFactory(config);
  }, 'FlagSets config');
}
