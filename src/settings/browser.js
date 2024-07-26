import { settingsValidation } from '@splitsoftware/splitio-commons/src/utils/settingsValidation';
import { validateRuntime } from '@splitsoftware/splitio-commons/src/utils/settingsValidation/runtime';
import { validateLogger } from '@splitsoftware/splitio-commons/src/utils/settingsValidation/logger/builtinLogger';
import { LocalhostFromObject } from '@splitsoftware/splitio-commons/src/sync/offline/LocalhostFromObject';
import { validateConsent } from '@splitsoftware/splitio-commons/src/utils/settingsValidation/consent';
import { STANDALONE_MODE } from '@splitsoftware/splitio-commons/src/utils/constants';

import { defaults } from './defaults/browser';
import { validateStorage } from './storage/browser';
import { validateIntegrations } from './integrations/browser';

const params = {
  defaults,
  acceptKey: true, acceptTT: true, // Client with bound key and optional TT
  runtime: validateRuntime,
  storage: validateStorage,
  integrations: validateIntegrations,
  logger: validateLogger,
  localhost: () => LocalhostFromObject(),
  consent: validateConsent,
};

export function settingsFactory(config) {
  const settings = settingsValidation(config, params);

  // Override in localhost mode to properly emit SDK_READY
  if (settings.mode !== STANDALONE_MODE) settings.sync.largeSegmentsEnabled = false;

  return settings;
}
