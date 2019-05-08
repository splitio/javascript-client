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

import logFactory from '../../utils/logger';
const log = logFactory('splitio-producer:segment-changes');
const inputValidationLog = logFactory('', { displayAllErrors: true });
import segmentChangesFetcher from '../fetcher/SegmentChanges';
import { findIndex, startsWith } from '../../utils/lang';
import { SplitError } from '../../utils/lang/Errors';

const SegmentChangesUpdaterFactory = context => {
  const {
    [context.constants.SETTINGS]: settings,
    [context.constants.READINESS]: readiness,
    [context.constants.STORAGE]: storage,
    [context.constants.COLLECTORS]: metricCollectors
  } = context.getAll();
  const segmentsEventEmitter = readiness.segments;

  let readyOnAlreadyExistentState = true;

  return async function SegmentChangesUpdater() {
    log.debug('Started segments update');

    // Async fetchers are collected here.
    const updaters = [];

    // Read list of available segments names to be updated.
    const segments = await storage.segments.getRegisteredSegments();

    for (let segmentName of segments) {
      const since = await storage.segments.getChangeNumber(segmentName);

      log.debug(`Processing segment ${segmentName}`);

      updaters.push(segmentChangesFetcher(settings, segmentName, since, metricCollectors).then(async function (changes) {
        let changeNumber = -1;

        for (let x of changes) {
          if (x.added.length > 0)
            await storage.segments.addToSegment(segmentName, x.added);

          if (x.removed.length > 0)
            await storage.segments.removeFromSegment(segmentName, x.removed);

          if (x.added.length > 0 || x.removed.length > 0) {
            await storage.segments.setChangeNumber(segmentName, x.till);
            changeNumber = x.till;
          }

          log.debug(`Processed ${segmentName} with till = ${x.till}. Added: ${x.added.length}. Removed: ${x.removed.length}`);
        }

        return changeNumber;
      }));
    }

    return Promise.all(updaters).then(shouldUpdateFlags => {
      if (findIndex(shouldUpdateFlags, v => v !== -1) !== -1 || readyOnAlreadyExistentState) {
        readyOnAlreadyExistentState = false;
        segmentsEventEmitter.emit(segmentsEventEmitter.SDK_SEGMENTS_ARRIVED);
      }
    }).catch(error => {
      if (!(error instanceof SplitError)) setTimeout(() => {throw error;}, 0);

      if (startsWith(error.message, '403')) {
        context.put(context.constants.DESTROYED, true);
        inputValidationLog.error('Factory instantiation: you passed a Browser type authorizationKey, please grab an Api Key from the Split web console that is of type SDK.');
      }
    });
  };

};

export default SegmentChangesUpdaterFactory;
