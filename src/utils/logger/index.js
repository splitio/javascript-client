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

'use strict';

const Logger = require('logplease');

const LS_KEY = 'splitio_debug';
const ENV_VAR_KEY = 'SPLITIO_DEBUG';

const isNode = Boolean(process && process.version);

const initialState = String(
  isNode ?
  process.env[ENV_VAR_KEY] :
  window.localStorage.getItem(LS_KEY)
);

const API = {
  enable() {
    Logger.setLogLevel(Logger.LogLevels.DEBUG);
  },
  disable() {
    Logger.setLogLevel(Logger.LogLevels.NONE);
  }
};

// "enable", "enabled" and "on" are acceptable values
if (/^(enabled?|on)/i.test(initialState)) {
  API.enable();
} else {
  // By default it starts disabled.
  API.disable();
}

// Expose the logger instance creation function as the default export
exports = module.exports = Logger.create;
// And our API for programatically usage.
exports.API = API;
