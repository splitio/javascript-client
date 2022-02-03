import { settingsValidation } from '@splitsoftware/splitio-commons/src/utils/settingsValidation';
import { defaults } from './defaults/browser';
import { validateStorage } from './storage/browser';
import { validateIntegrations } from './integrations/browser';
import { validateLogger } from '@splitsoftware/splitio-commons/src/utils/settingsValidation/logger/builtinLogger';
import { LocalhostFromObject } from '@splitsoftware/splitio-commons/src/sync/offline/LocalhostFromObject';

const params = {
  defaults,
  storage: validateStorage,
  integrations: validateIntegrations,
  logger: validateLogger,
  localhost: () => LocalhostFromObject(),
};

export function settingsFactory(config) {
  return settingsValidation(config, params);
}
