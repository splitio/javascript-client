import { objectAssign } from '@splitsoftware/splitio-commons/src/utils/lang/objectAssign';
import { _Map } from '@splitsoftware/splitio-commons/src/utils/lang/maps';
import { isObject, isFiniteNumber, isString } from '@splitsoftware/splitio-commons/src/utils/lang';
// @TODO import RumAgent internally or users should import it?
import { SplitRumAgent } from '@splitsoftware/browser-rum-agent';

import { SplitFactory } from './browser';

const DEFAULT_TRAFFIC_TYPE = 'user';

/**
 * Validates an identity object.
 * @param {import('@splitsoftware/splitio-commons/src/types').ISettings['core']} identity
 * @param {import('@splitsoftware/splitio-commons/src/types').ISettings['log']} log
 * @returns {SplitIO.Identity | undefined}
 */
function validateIdentity(identity, log) {
  if (!isObject(identity)) {
    log.error('Identity must be an objects with key and optional trafficType.');
    return;
  }

  let { key, trafficType } = identity;

  if (isFiniteNumber(key)) key = key + '';
  if (!isString(key)) {
    log.error('Key must be a string or number.');
    return;
  }

  if (!isString(trafficType) && key) {
    log.error('Traffic Type must be a string or nullish.');
    return;
  }

  return {
    key: key.trim(),
    trafficType: trafficType ? trafficType.trim().toLowerCase() : DEFAULT_TRAFFIC_TYPE
  };
}

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

  // Validate settings
  /** @type {import('../../types/splitio').IBrowserSuiteSettings} */
  const settings = sdk.settings;
  const { log, rumAgent } = settings;
  if (rumAgent !== undefined && !isObject(rumAgent)) {
    log.error('settings: invalid `rumAgent` config. It must be undefined or an object.');
    settings.rumAgent = undefined;
  }

  // Configure RUM Agent
  const { prefix, properties, register } = settings.rumAgent || {};

  if (register) register.forEach(eventCollector => SplitRumAgent.register(eventCollector));
  if (properties) SplitRumAgent.setProperties(properties);

  SplitRumAgent.__getConfig().log = settings.log;
  SplitRumAgent.setup(settings.core.authorizationKey, {
    prefix,
    url: settings.urls.events,
    pushRate: settings.scheduler.eventsPushRate,
    queueSize: settings.scheduler.eventsQueueSize
  });

  // Set identity for main client, with 'user' TT if not provided
  const mainIdentity = validateIdentity(settings.core, log);
  SplitRumAgent.addIdentity(mainIdentity);
  const clients = new _Map();
  clients.set(JSON.stringify(mainIdentity), sdk.client());

  // Suite methods: addIdentity, removeIdentity, destroy

  function addIdentity(key, trafficType) {
    const identity = validateIdentity({ key, trafficType }, log);
    if (!identity) return;
    const sIdentity = JSON.stringify(identity);

    if (!clients.has(sIdentity)) {
      SplitRumAgent.addIdentity(identity);
      const client = sdk.client(identity.key, identity.trafficType);
      clients.set(sIdentity, client);
    }
    return clients.get(sIdentity);
  }

  function removeIdentity(key, trafficType) {
    const identity = validateIdentity({ key, trafficType }, log);
    const sIdentity = JSON.stringify(identity);

    if (clients.has(sIdentity)) {
      SplitRumAgent.removeIdentity(identity);
      const client = clients.get(sIdentity);
      clients.delete(sIdentity);
      return client.destroy();
    }
    return Promise.resolve();
  }

  function destroy() {
    return Promise.all(clients.keys().map((sIdentity) => {
      const identity = JSON.parse(sIdentity);
      return removeIdentity(identity);
    }));
  }

  return objectAssign(sdk, {
    addIdentity,
    removeIdentity,
    destroy
  });
}
