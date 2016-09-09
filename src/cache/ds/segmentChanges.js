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
const segmentChangesService = require('../../services/segmentChanges');
const segmentChangesRequest = require('../../services/segmentChanges/get');

const segmentMutatorFactory = require('../mutators/segmentChanges');

function greedyFetch(settings, lastSinceValue, segmentName) {
  return segmentChangesService(segmentChangesRequest(settings, {
    since: lastSinceValue,
    segmentName
  }))
  .then(resp => resp.json())
  .then(json => {
    let {since, till} = json;

    if (since === till) {
      return [json];
    } else {
      return Promise.all([json, greedyFetch(settings, till, segmentName)]).then(flatMe => {
        return [flatMe[0], ...flatMe[1]];
      });
    }
  })
  .catch(function () {
    // if something goes wrong with the request to the server, we are going to
    // stop requesting information till the next round of downloading
    return [];
  });
}

function segmentChangesDataSource(settings, segmentName, sinceValuesCache) {
  const sinceValue = sinceValuesCache.get(segmentName) || -1;

  return greedyFetch(settings, sinceValue, segmentName).then(changes => {
    const len = changes.length;
    const lastChange = len > 0 ? changes[len - 1] : false;

    // doesn't matter if we fully download the information, say if we need to
    // update the data or not.
    const shouldUpdate = !(len === 0 || len === 1 && changes[0].since === changes[0].till);

    // do we fully download the segment's changes from the server?
    const isFullUpdate = lastChange && lastChange.since === lastChange.till;

    // fn which actually applies the changes
    let mutator = () => false;

    if (shouldUpdate) {
      sinceValuesCache.set(segmentName, changes[len - 1].till);
      mutator = segmentMutatorFactory(changes);
    }

    return {
      shouldUpdate, // did an update?
      isFullUpdate, // did it was partial or full?
      mutator
    };
  });
}

module.exports = segmentChangesDataSource;
module.exports.greedyFetch = greedyFetch;
