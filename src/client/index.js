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
// @flow

'use strict';

// I'll need to fix first 'isomorphic-fetch' to be transpiled using
// babel-runtime before remove this line of code.
require('core-js/es6/promise');

const warning = require('warning');
const log = require('debug')('splitio-client');

const Engine = require('../engine');

const SplitClientFactory = (storage: SplitStorage): SplitClient => {

  return {
    async getTreatment(key: string, splitName: string, attributes: ?Object): Promise<string> {
      const splitObject = await storage.splits.getSplit(splitName);
      let treatment = 'control';

      if (splitObject) {
        let split = Engine.parse(JSON.parse(splitObject), storage);

        treatment = await split.getTreatment(key, attributes);

        log(`Split ${splitName} key ${key} evaluation ${treatment}`);
      } else {
        log(`Split ${splitName} doesn't exist`);
      }

      return treatment;
    }
  };

};

module.exports = SplitClientFactory;
