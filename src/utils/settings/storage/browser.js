/**
Copyright 2022 Split Software

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
**/

import { isLocalStorageAvailable } from '@splitsoftware/splitio-commons/src/utils/env/isLocalStorageAvailable';
import { LOCALHOST_MODE, STORAGE_MEMORY } from '@splitsoftware/splitio-commons/src/utils/constants';

const STORAGE_LOCALSTORAGE = 'LOCALSTORAGE';

export function validateStorage(settings) {
  let {
    mode,
    storage: {
      type,
      options = {},
      prefix
    } = { type: STORAGE_MEMORY },
  } = settings;
  let __originalType;

  if (prefix) {
    prefix += '.SPLITIO';
  } else {
    prefix = 'SPLITIO';
  }

  const fallbackToMemory = () => {
    __originalType = type;
    type = STORAGE_MEMORY;
  };

  // In localhost mode, fallback to Memory storage and track original
  // type to emit SDK_READY_FROM_CACHE if corresponds
  if (mode === LOCALHOST_MODE && type === STORAGE_LOCALSTORAGE) {
    fallbackToMemory();
  }

  // If an invalid storage type is provided OR we want to use LOCALSTORAGE and
  // it's not available, fallback into MEMORY
  if (type !== STORAGE_MEMORY && type !== STORAGE_LOCALSTORAGE ||
    type === STORAGE_LOCALSTORAGE && !isLocalStorageAvailable()) {
    fallbackToMemory();
    settings.log.warn('Invalid or unavailable storage. Fallbacking into MEMORY storage');
  }

  return {
    type,
    options,
    prefix,
    __originalType
  };
}
