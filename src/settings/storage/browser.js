import { isLocalStorageAvailable } from '@splitsoftware/splitio-commons/src/utils/env/isLocalStorageAvailable';
import { LOCALHOST_MODE, STORAGE_MEMORY } from '@splitsoftware/splitio-commons/src/utils/constants';

const STORAGE_LOCALSTORAGE = 'LOCALSTORAGE';

export function validateStorage(settings) {
  let {
    log,
    mode,
    storage: {
      type,
      options = {},
      prefix
    } = { type: STORAGE_MEMORY },
  } = settings;
  let __originalType;

  const fallbackToMemory = () => {
    __originalType = type;
    type = STORAGE_MEMORY;
  };

  // In localhost mode, fallback to Memory storage and track original type to emit SDK_READY_FROM_CACHE if corresponds.
  // ATM, other mode settings (e.g., 'consumer') are ignored in client-side API, and so treated as standalone.
  if (mode === LOCALHOST_MODE && type === STORAGE_LOCALSTORAGE) {
    fallbackToMemory();
  }

  // If an invalid storage type is provided OR we want to use LOCALSTORAGE and
  // it's not available, fallback into MEMORY
  if (type !== STORAGE_MEMORY && type !== STORAGE_LOCALSTORAGE ||
    type === STORAGE_LOCALSTORAGE && !isLocalStorageAvailable()) {
    fallbackToMemory();
    log.error('Invalid or unavailable storage. Fallbacking into MEMORY storage');
  }

  return {
    type,
    options,
    prefix,
    __originalType
  };
}
