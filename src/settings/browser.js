import { settingsValidation } from '@splitsoftware/splitio-commons/src/utils/settingsValidation';
import { validateRuntime } from '@splitsoftware/splitio-commons/src/utils/settingsValidation/runtime';
import { validateLogger } from '@splitsoftware/splitio-commons/src/utils/settingsValidation/logger/builtinLogger';
import { validateConsent } from '@splitsoftware/splitio-commons/src/utils/settingsValidation/consent';

import { defaults } from './defaults/browser';
import { validateStorage } from './storage/browser';

const params = {
  defaults,
  acceptKey: true, // Client with bound key
  runtime: validateRuntime,
  storage: validateStorage,
  logger: validateLogger,
  consent: validateConsent,
};

export function settingsFactory(config) {
  return settingsValidation(config, params);
}
