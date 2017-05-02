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

const timeTracker = {};

const logger = Logger.create('[TIME TRACKER]', {
  showTimestamp: false,
  showLevel: false,
  color: Logger.Colors.Blue
});

const TrackerAPI = {
  start(task) {
    timeTracker[task] = Date.now();
  },
  stop(task) {
    const elapsedTime = Date.now() - timeTracker[task];
    if (!isNaN(elapsedTime)) {
      delete timeTracker[task];
      logger.log(`[${task}] took ${elapsedTime}ms to finish.`);
    }
  }
};

// Our "time tracker" API
module.exports = TrackerAPI;
