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

import { Logger, LogLevels, setLogLevel } from './LoggerFactory';
import isLocalStorageAvailable from '../localstorage/isAvailable';
import { find, merge } from '../lang';

const isLogLevelString = str => !!find(LogLevels, lvl => str === lvl);

const defaultOptions = {
  showLevel: true,
  displayAllErrors: false
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

const createLog = (namespace, options = {}) => new Logger(namespace, merge(options, defaultOptions));

const ownLog = createLog('splitio-utils:logger');

/**
 * The public Logger utility API.
 */
export const API = {
  /**
   * Enables all the logs.
   */
  enable() {
    setLogLevel(LogLevels.DEBUG);
  },
  /**
   * Sets a custom log Level for the SDK.
   * @param {string} logLevel - Custom LogLevel value.
   */
  setLogLevel(logLevel) {
    if (isLogLevelString(logLevel)) {
      setLogLevel(logLevel);
    } else {
      ownLog.error('Invalid Log Level - No changes to the logs will be applied.');
    }
  },
  /**
   * Disables all the log levels.
   */
  disable() {
    // Disabling is equal logLevel none
    setLogLevel(LogLevels.NONE);
  },
  /**
   * Exposed for usage with setLogLevel
   */
  LogLevel: LogLevels
};

// "enable", "enabled" and "on", are synonims with 'DEBUG' loglevel
if (/^(enabled?|on)/i.test(initialState)) {
  API.enable(LogLevels.DEBUG);
} else if (isLogLevelString(initialState)) {
  API.setLogLevel(initialState);
} else {
  // By default it starts disabled.
  API.disable();
}

// By default we expose logger instance creator wrapper.
export default createLog;
