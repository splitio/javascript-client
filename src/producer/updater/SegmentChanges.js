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
import { findIndex } from '../../utils/lang';
import { SplitError } from '../../utils/lang/Errors';
import thenable from '../../utils/promise/thenable';

const SegmentChangesUpdaterFactory = context => {
  const {
    [context.constants.SETTINGS]: settings,
    [context.constants.READINESS]: readiness,
    [context.constants.STORAGE]: storage,
    [context.constants.COLLECTORS]: metricCollectors
  } = context.getAll();
  const segmentsEventEmitter = readiness.segments;

  let readyOnAlreadyExistentState = true;

  /**
   * @param {string[] | undefined} segmentNames list of segment names to fetch. By passing `undefined` it fetches the list of segments registered at the storage
   */
  return function SegmentChangesUpdater(segmentNames) {
    log.debug('Started segments update');

    // Async fetchers are collected here.
    const updaters = [];

    function segmentsUpdater(segments) {
      const sincePromises = [];
      for (let segmentName of segments) {

        const segmentUpdater = function (since) {
          log.debug(`Processing segment ${segmentName}`);

          updaters.push(segmentChangesFetcher(settings, segmentName, since, metricCollectors).then(function (changes) {
            let changeNumber = -1;
            const changePromises = [];
            for (let x of changes) {
              let promises = [];
              if (x.added.length > 0) {
                const result = storage.segments.addToSegment(segmentName, x.added);
                if (thenable(result)) promises.push(result);
              }
              if (x.removed.length > 0) {
                const result = storage.segments.removeFromSegment(segmentName, x.removed);
                if (thenable(result)) promises.push(result);
              }
              if (x.added.length > 0 || x.removed.length > 0) {
                const result = storage.segments.setChangeNumber(segmentName, x.till);
                if (thenable(result)) promises.push(result);
                changeNumber = x.till;
              }

              log.debug(`Processed ${segmentName} with till = ${x.till}. Added: ${x.added.length}. Removed: ${x.removed.length}`);

              if (promises.length > 0) changePromises.push(...promises);
            }

            return Promise.all(changePromises).then(function () {
              return changeNumber;
            });
          }));
        };

        const since = storage.segments.getChangeNumber(segmentName);
        const sincePromise = thenable(since) ? since.then(segmentUpdater) : segmentUpdater(since);
        sincePromises.push(sincePromise);
      }

      return Promise.all(sincePromises).then(function () {
        return Promise.all(updaters).then(shouldUpdateFlags => {
          if (findIndex(shouldUpdateFlags, v => v !== -1) !== -1 || readyOnAlreadyExistentState) {
            readyOnAlreadyExistentState = false;
            segmentsEventEmitter.emit(segmentsEventEmitter.SDK_SEGMENTS_ARRIVED);
          }
        }).catch(error => {
          if (!(error instanceof SplitError)) setTimeout(() => { throw error; }, 0);

          if (error.statusCode === 403) {
            context.put(context.constants.DESTROYED, true);
            inputValidationLog.error('Factory instantiation: you passed a Browser type authorizationKey, please grab an Api Key from the Split web console that is of type SDK.');
          }
        });
      });
    }

    // If not a segment name provided, read list of available segments names to be updated.
    const segments = segmentNames ? segmentNames : storage.segments.getRegisteredSegments();
    return thenable(segments) ? segments.then(segmentsUpdater) : segmentsUpdater(segments);
  };

};

export default SegmentChangesUpdaterFactory;
