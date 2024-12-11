import { isLocalStorageAvailable } from '@splitsoftware/splitio-commons/src/utils/env/isLocalStorageAvailable';
import { STORAGE_MEMORY } from '@splitsoftware/splitio-commons/src/utils/constants';

const STORAGE_LOCALSTORAGE = 'LOCALSTORAGE';

export function validateStorage(settings) {
  let {
    log,
    storage: {
      type,
      options = {},
      prefix
    } = { type: STORAGE_MEMORY },
  } = settings;

  // If an invalid storage type is provided OR we want to use LOCALSTORAGE and
  // it's not available, fallback into MEMORY
  if (type !== STORAGE_MEMORY && type !== STORAGE_LOCALSTORAGE ||
    type === STORAGE_LOCALSTORAGE && !isLocalStorageAvailable()) {
    type = STORAGE_MEMORY;
    log.error('Invalid or unavailable storage. Fallback into MEMORY storage');
  }

  return {
    type,
    options,
    prefix,
  };
}
