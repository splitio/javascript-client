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

export default function fetchSpecificSplits(fetchMock, assert) {

  assert.plan(splitFilters.length+1);

  for (let i = 0; i < splitFilters.length; i++) {
    const urls = { sdk: 'https://sdkurl' + i };
    const config = { ...baseConfig, sync: { splitFilters: splitFilters[i] }, urls };

    if (groupedFilters[i]) { // tests where validateSplitFilters executes normally
      const queryString = queryStrings[i] || '';
      let factory;

      fetchMock.getOnce(urls.sdk + '/splitChanges?since=-1' + queryString, { status: 200, body: { splits: [], since: -1, till: 1457552620999 } });
      fetchMock.getOnce(urls.sdk + '/splitChanges?since=1457552620999' + queryString, { status: 200, body: { splits: [], since: 1457552620999, till: 1457552620999 } });
      fetchMock.getOnce(urls.sdk + '/splitChanges?since=1457552620999' + queryString, function () {
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

    fetchMock.getOnce(baseUrls.sdk + '/splitChanges?since=-1&sets=4_valid,set_2,set_3,set_ww,set_x',  async function () {
      t.pass('flag set query correctly formed');
      return { status: 200, body: { splits: [], since: 1457552620999, till: 1457552620999 } };
    });

    const factory = SplitFactory(config);
    const client = factory.client();

    client.ready().then(async () => {
      await client.destroy();
      t.end();
    });
  }, 'FlagSets config');
}
