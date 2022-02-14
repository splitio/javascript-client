import { settingsValidation } from '@splitsoftware/splitio-commons/src/utils/settingsValidation';
import { defaults } from './defaults/node';
import { validateRuntime } from '@splitsoftware/splitio-commons/src/utils/settingsValidation/runtime/node';
import { validateStorage } from './storage/node';
import { validateLogger } from '@splitsoftware/splitio-commons/src/utils/settingsValidation/logger/builtinLogger';
import { LocalhostFromFile } from '@splitsoftware/splitio-commons/src/sync/offline/LocalhostFromFile';

const params = {
  defaults,
  runtime: validateRuntime,
  storage: validateStorage,
  logger: validateLogger,
  localhost: () => LocalhostFromFile(),
  // For now, Node SDK ignores settings.integrations, so no integration validator is passed
};

export function settingsFactory(config) {
  return settingsValidation(config, params);
}
