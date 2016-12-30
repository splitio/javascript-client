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

const repeat = require('../utils/fn/repeat');

class Updater {
  constructor(
    splitsUpdater,
    segmentsUpdater,
    splitsUpdaterRefreshRate,
    segmentsUpdaterRefreshRate
  ) {
    this.splitsUpdater = splitsUpdater;
    this.segmentsUpdater = segmentsUpdater;
    this.splitsUpdaterRefreshRate = splitsUpdaterRefreshRate;
    this.segmentsUpdaterRefreshRate = segmentsUpdaterRefreshRate;
  }

  start() {
    this.stopSplitsUpdate = repeat(
      scheduleSplitsUpdate => this.splitsUpdater().then(() => scheduleSplitsUpdate()),
      this.splitsUpdaterRefreshRate
    );

    this.stopSegmentsUpdate = repeat(
      scheduleSegmentsUpdate => this.segmentsUpdater().then(() => scheduleSegmentsUpdate()),
      this.segmentsUpdaterRefreshRate
    );
  }

  stop() {
    this.stopSplitsUpdate && this.stopSplitsUpdate();
    this.stopSegmentsUpdate && this.stopSegmentsUpdate();
  }
}

module.exports = Updater;
