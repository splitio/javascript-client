import { SplitFactory } from '../../';
import { splitFilters, queryStrings, groupedFilters } from '../mocks/fetchSpecificSplits';

const baseConfig = {
  core: {
    authorizationKey: '<fake-token-push-1>',
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

      fetchMock.getOnce(urls.sdk + '/splitChanges?s=1.1&since=-1' + queryString, { status: 200, body: { splits: [], since: -1, till: 1457552620999 } });
      fetchMock.getOnce(urls.sdk + '/splitChanges?s=1.1&since=1457552620999' + queryString, { status: 200, body: { splits: [], since: 1457552620999, till: 1457552620999 } });
      fetchMock.getOnce(urls.sdk + '/splitChanges?s=1.1&since=1457552620999' + queryString, function () {
        factory.client().destroy().then(() => {
          assert.pass(`splitFilters #${i}`);
        });
        return { status: 200, body: { splits: [], since: 1457552620999, till: 1457552620999 } };
      });

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
      sync: {
        splitFilters
      }
    };

    let factory;
    const queryString = '&sets=4_valid,set_2,set_3,set_ww,set_x';

    fetchMock.getOnce(baseUrls.sdk + '/splitChanges?s=1.1&since=-1' + queryString, { status: 200, body: { splits: [], since: 1457552620999, till: 1457552620999 }});
    fetchMock.getOnce(baseUrls.sdk + '/splitChanges?s=1.1&since=1457552620999' + queryString, async function () {
      t.pass('flag set query correctly formed');
      factory.client().destroy().then(() => {
        t.end();
      });
    });
    factory = SplitFactory(config);
  }, 'FlagSets config');
}
