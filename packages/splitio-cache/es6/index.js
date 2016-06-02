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
const SchedulerFactory = require('@splitsoftware/splitio-utils/lib/scheduler');
const Storage = require('./storage');
const Updaters = require('./updaters');

const log = require('debug')('splitio-cache');
const sync = require('./sync');

class Cache {
  constructor(settings, hub) {
    this.settings = settings;
    this.hub = hub;

    this.splitRefreshScheduler = SchedulerFactory();
    this.segmentsRefreshScheduler = SchedulerFactory();

    this.storage = Storage.createStorage();

    this.splitsUpdater = Updaters.SplitsUpdater(this.settings, this.hub, this.storage);
    this.segmentsUpdater = Updaters.SegmentsUpdater(this.settings, this.hub, this.storage);
  }

  start() {
    log('sync started');

    return sync.call(this);
  }

  stop() {
    log('stopped syncing');

    this.splitRefreshScheduler.kill();
    this.segmentsRefreshScheduler.kill();
  }
}

module.exports = Cache;
