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

const Pool = require('generic-pool').Pool;

const log = require('debug')('splitio-cache:pool');

const settings = require('@splitsoftware/splitio-utils/lib/settings');

module.exports = function factory(overrides) {
  return new Pool(Object.assign({}, {
    refreshIdle: false,
    create(callback) {
      callback(null, {});
    },
    destroy() {},
    max: settings.get('node').http.poolSize,
    log
  }, overrides));
};
