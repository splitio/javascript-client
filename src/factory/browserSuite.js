import { objectAssign } from '@splitsoftware/splitio-commons/src/utils/lang/objectAssign';
import { _Set, setToArray } from '@splitsoftware/splitio-commons/src/utils/lang/sets';
import { STANDALONE_MODE } from '@splitsoftware/splitio-commons/src/utils/constants';
// @TODO import RumAgent automatically or users should import it?
import { SplitRumAgent } from '@splitsoftware/browser-rum-agent';
import { SplitFactory } from './browser';

const DEFAULT_TRAFFIC_TYPE = 'user';

/**
 * SplitFactory for client-side with RUM Agent.
 *
 * @param {import('../../types/splitio').IBrowserSuiteSettings} config configuration object used to instantiate the Suite
 * @param {Function=} __updateModules optional function that lets redefine internal SDK modules. Use with
 * caution since, unlike `config`, this param is not validated neither considered part of the public API.
 * @throws Will throw an error if the provided config is invalid.
 */
export function SplitSuite(config, __updateModules) {
  const sdk = SplitFactory(config, __updateModules);

  /** @type {import('../../types/splitio').IBrowserSuiteSettings} */
  const settings = sdk.settings;

  // Do not setup RUM Agent if not in standalone mode
  if (settings.mode !== STANDALONE_MODE) return sdk;

  // Setup RUM Agent
  const agentConfig = SplitRumAgent.__getConfig();
  if (agentConfig.a) {
    settings.log.warn('RUM Agent already setup. The new Suite instance will reset the RUM Agent configuration.');
  }
  agentConfig.log = settings.log;
  SplitRumAgent.removeIdentities(); // reset identities for new Suite
  SplitRumAgent.setup(settings.core.authorizationKey, objectAssign({
    url: settings.urls.events
  }, settings.rumAgent));

  const clients = new _Set();

  // Create Suite instance extending SDK
  return objectAssign({}, sdk, {
    client() {
      const client = sdk.client.apply(sdk, arguments);

      if (!clients.has(client)) {
        clients.add(client);

        SplitRumAgent.addIdentity({
          key: client.key,
          trafficType: client.trafficType || DEFAULT_TRAFFIC_TYPE
        });

        // override client.destroy to remove identity from RUM Agent
        const originalDestroy = client.destroy;
        client.destroy = function () {
          SplitRumAgent.removeIdentity({
            key: client.key,
            trafficType: client.trafficType || DEFAULT_TRAFFIC_TYPE
          });
          return originalDestroy.apply(client, arguments);
        };
      }

      return client;
    },

    destroy() {
      return Promise.all(setToArray(clients).map(client => client.destroy()));
    }
  });
}
