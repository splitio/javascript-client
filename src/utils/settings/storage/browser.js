/**
Copyright 2016 Split Software

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

import logFactory from '../../../utils/logger';
const log = logFactory('splitio-settings');
import isLocalStorageAvailable from '../../../utils/localstorage/isAvailable';
import {
  LOCALHOST_MODE,
  STORAGE_MEMORY,
  STORAGE_LOCALSTORAGE
} from '../../../utils/constants';

const ParseStorageSettings = settings => {
  let {
    mode,
    storage: {
      type = STORAGE_MEMORY,
      options = {},
      prefix
    },
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
    log.warn('Invalid or unavailable storage. Fallbacking into MEMORY storage');
  }

  return {
    type,
    options,
    prefix,
    __originalType
  };
};

export default ParseStorageSettings;