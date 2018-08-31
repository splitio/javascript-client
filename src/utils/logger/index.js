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

import Logger from 'logplease-es5';
import isLocalStorageAvailable from '../localstorage/isAvailable';

const defaultOptions = {
  useColors: false,
  showTimestamp: false
};

const LS_KEY = 'splitio_debug';
const ENV_VAR_KEY = 'SPLITIO_DEBUG';
let isNode = false;

// We check for version truthiness since most shims will have that as empty string.
if (typeof process !== 'undefined' && typeof process.version !== 'undefined' && !!process.version) {
  isNode = true;
}

const initialState = String(
  isNode ?
    process.env[ENV_VAR_KEY] :
    isLocalStorageAvailable() ?
      localStorage.getItem(LS_KEY) : ''
);

export const API = {
  enable() {
    Logger.setLogLevel(Logger.LogLevels.DEBUG);
  },
  disable() {
    Logger.setLogLevel(Logger.LogLevels.NONE);
  }
};

const createLog = namespace => Logger.create(namespace, defaultOptions);

// "enable", "enabled" and "on" are acceptable values
if (/^(enabled?|on)/i.test(initialState)) {
  API.enable();
} else {
  // By default it starts disabled.
  API.disable();
}

// By default we expose logger instance creator wrapper.
export default createLog;
