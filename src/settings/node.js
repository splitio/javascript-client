import { settingsValidation } from '@splitsoftware/splitio-commons/src/utils/settingsValidation';
import { validateLogger } from '@splitsoftware/splitio-commons/src/utils/settingsValidation/logger/builtinLogger';
import { LocalhostFromFile } from '../sync/offline/LocalhostFromFile';

import { defaults } from './defaults/node';
import { validateStorage } from './storage/node';
import { validateRuntime } from './runtime/node';

const params = {
  defaults,
  runtime: validateRuntime,
  storage: validateStorage,
  logger: validateLogger,
  localhost: () => LocalhostFromFile(),
  // In Node.js the SDK ignores `config.integrations`, so a validator for integrations is not required
};

export function settingsFactory(config) {
  const settings = settingsValidation(config, params);

  // if provided, keeps reference to the `requestOptions` object
  if (settings.sync.requestOptions) settings.sync.requestOptions = config.sync.requestOptions;

  // Reset config options not supported in Node.js
  if (settings.sync.largeSegmentsEnabled) settings.log.warn('Client instantiation: config.sync.largeSegmentsEnabled option is not supported in NodeJS. Ignoring it.');
  settings.sync.largeSegmentsEnabled = false;

  return settings;
}
