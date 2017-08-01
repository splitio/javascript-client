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

const uniqueId = require('lodash/uniqueId');
const Logger = require('logplease');
const timer = require('./timer');
const thenable = require('../promise/thenable');

// logger to be used on this module
const logger = Logger.create('[TIME TRACKER]', {
  showTimestamp: false,
  showLevel: false,
  useColors: false
});
// Map we will use for storing timers
const timers = {};
// We will use this variable for storing the metrics trackers object.
let metricTrackers = false;
// Functions we will use to get the different tracker modules. It needs to be in this way as we can't
// set these right away when first starting capturing times.
const getSDKMetricsTracker = () => metricTrackers.sdkMetrics || false;
const getMySegmentMetricsTracker = () => metricTrackers.mySegmentsMetrics || false;
const getSegmentChangesMetricsTracker = () => metricTrackers.segmentChangesMetrics || false;
const getSplitChangesMetricsTracker = () => metricTrackers.splitChangesMetrics || false;
// Tasks constants
const CONSTANTS = {
  SDK_READY: 'Getting ready - Split SDK',
  SDK_GET_TREATMENT: 'SDK - Get Treatment',
  SPLITS_READY: 'Getting ready - Splits',
  SEGMENTS_READY: 'Getting ready - Segments',
  METRICS_PUSH: 'Pushing - Metrics',
  IMPRESSIONS_PUSH: 'Pushing - Impressions',
  MY_SEGMENTS_FETCH: 'Fetching - My Segments',
  SEGMENTS_FETCH: 'Fetching - Segments',
  SPLITS_FETCH: 'Fetching - Splits'
};
// Tasks callbacks, if any
const CALLBACKS = {
  [CONSTANTS.SDK_READY]: {
    metrics: getSDKMetricsTracker,
    method: 'ready'
  },
  [CONSTANTS.SDK_GET_TREATMENT]: {
    metrics: getSDKMetricsTracker,
    method: 'latency'
  },
  [CONSTANTS.MY_SEGMENTS_FETCH]: {
    metrics: getMySegmentMetricsTracker,
    method: 'latency'
  },
  [CONSTANTS.SEGMENTS_FETCH]: {
    metrics: getSegmentChangesMetricsTracker,
    method: 'latency'
  },
  [CONSTANTS.SPLITS_FETCH]: {
    metrics: getSplitChangesMetricsTracker,
    method: 'latency'
  }
};

const TrackerAPI = {
  /**
   * "Private" method, used to attach count/countException callbacks to a promise.
   *
   * @param {Promise} promise - The promise we want to attach the callbacks.
   * @param {string} task - The name of the task.
   * @param {string} modifier - (optional) The modifier for the task, if any.
   */
  __attachToPromise(promise, task, modifier) {
    return promise.then(resp => {
      this.stop(task, modifier);

      const tracker = CALLBACKS[task] && CALLBACKS[task].metrics();
      tracker.count && tracker.count(resp.status);

      return resp;
    })
    .catch(err => {
      this.stop(task, modifier);

      const tracker = CALLBACKS[task] && CALLBACKS[task].metrics();
      tracker.countException && tracker.countException();

      throw err;
    });
  },
  /**
   * Starts tracking the time for a given task.
   *
   * @param {string} task - The task we are starting.
   * @param {Promise} promise - (optional) The promise we are tracking.
   */
  start(task, promise) {
    let result;
    // If we are registering a promise with this task, we should count the status and the exceptions as well
    // as stopping the task when the promise resolves.
    if (thenable(promise)) {
      result = this.__attachToPromise(promise, task);
    }

    // Start the timer, then save the reference. We do it last to avoid counting as much extra processing
    // as possible on the latencies.
    timers[task] = timer();

    // If no promise is present, we will return undefined as before.
    return result;
  },
  /**
   * Starts tracking the time for a given UNIQUE task. By unique task we mean tasks that fall under the same concept
   * but each call should be tracked in a unique way. (So if you start two timers for the same task before stopping,
   * we should track them separately)
   *
   * @param {string} task - The task we are starting.
   * @return {Function} The stop function for this specific task.
   */
  startUnique(task, promise) {
    const taskUniqueId = uniqueId();
    let result;

    // If we are registering a promise with this task, we should count the status and the exceptions as well
    // as stopping the task when the promise resolves. Then return the promise
    if (thenable(promise)) {
      result = this.__attachToPromise(promise, task, taskUniqueId);
    } else {
      // If not, we return the stop function, as it will be stopped manually.
      result = this.stop.bind(this, task, taskUniqueId);
    }

    // We start the timer, with an uniqueId attached to it's name.
    timers[task + taskUniqueId] = timer();

    return result;
  },
  /**
   * Setup the metricTrackers variable for this module. This method should be called as soon as
   * the metrics get instantiated.
   *
   * @param {Object} trackers - The object containing all the metrics tracker modules.
   */
  setupTrackers(trackers) {
    metricTrackers = trackers;
  },
  /**
   * Stops the tracking of a given task.
   *
   * @param {string} task - The task we are starting.
   * @param {string} modifier - (optional) The modifier for that specific task.
   */
  stop(task, modifier) {
    const timerName = typeof modifier === 'string' ? task + modifier : task;
    const timer = timers[timerName];
    if (timer) {
      // Stop the timer and round result for readability.
      const et = Math.round( timer() );
      logger.log(`[${task}] took ${et}ms to finish.`);
      delete timers[timerName];

      // Check if we have a tracker callback.
      const tracker = CALLBACKS[task] && CALLBACKS[task].metrics();
      if (tracker) {
        // If we have a callback, we call it with the elapsed time of the task and then delete the reference.
        tracker[tracker.method](et);
      }
    }
  },
  /**
   * The constants shortcut for the task names.
   */
  C: CONSTANTS
};

// Our "time tracker" API
module.exports = TrackerAPI;
