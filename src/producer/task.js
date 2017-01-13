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

const log = require('debug')('splitio-producer:task');
const repeat = require('../utils/fn/repeat');

/**
 * Startable task factory.
 */
const TaskFactory = (updater: Function, period: number): Startable => {
  let stopUpdater;

  return {
    start() {
      log('Starting %s refreshing each %s', updater.name, period);

      stopUpdater = repeat(
        reschedule => {
          log('Running %s', updater.name);
          updater().then(() => reschedule());
        },
        period
      );
    },

    stop() {
      log('Stopping %s', updater.name);

      stopUpdater && stopUpdater();
    }
  };
};

module.exports = TaskFactory;
