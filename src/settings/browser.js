import { settingsValidation } from '@splitsoftware/splitio-commons/src/utils/settingsValidation';
import { defaults } from './defaults/browser';
import { validateRuntime } from '@splitsoftware/splitio-commons/src/utils/settingsValidation/runtime';
import { validateStorage } from './storage/browser';
import { validateIntegrations } from './integrations/browser';
import { validateLogger } from '@splitsoftware/splitio-commons/src/utils/settingsValidation/logger/builtinLogger';
import { LocalhostFromObject } from '@splitsoftware/splitio-commons/src/sync/offline/LocalhostFromObject';
import { validateConsent } from '@splitsoftware/splitio-commons/src/utils/settingsValidation/consent';

const params = {
  defaults,
  runtime: validateRuntime,
  storage: validateStorage,
  integrations: validateIntegrations,
  logger: validateLogger,
  localhost: () => LocalhostFromObject(),
  consent: validateConsent,
};

export function settingsFactory(config) {
  return settingsValidation(config, params);
}
