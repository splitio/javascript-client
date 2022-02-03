import { settingsValidation } from '@splitsoftware/splitio-commons/src/utils/settingsValidation';
import { defaults } from './defaults/node';
import { validateRuntime } from './runtime/node';
import { validateStorage } from './storage/node';
import { validateIntegrations } from './integrations/node';
import { validateLogger } from '@splitsoftware/splitio-commons/src/utils/settingsValidation/logger/builtinLogger';
import { LocalhostFromFile } from '@splitsoftware/splitio-commons/src/sync/offline/LocalhostFromFile';

const params = {
  defaults,
  runtime: validateRuntime,
  storage: validateStorage,
  integrations: validateIntegrations,
  logger: validateLogger,
  localhost: () => LocalhostFromFile(),
};

export function settingsFactory(config) {
  return settingsValidation(config, params);
}
