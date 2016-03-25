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

const segmentChangesService = require('@splitsoftware/splitio-services/lib/segmentChanges');
const segmentChangesRequest = require('@splitsoftware/splitio-services/lib/segmentChanges/get');

const segmentMutatorFactory = require('../mutators/segmentChanges');
const cache = new Map();

function greedyFetch(since, segmentName) {
  return segmentChangesService(segmentChangesRequest({
    since,
    segmentName
  }))
  .then(resp => resp.json())
  .then(json => {
    let {since, till} = json;

    if (since === till) {
      return [json];
    } else {
      return Promise.all([
        json,
        greedyFetch(json.till, segmentName)
      ]).then(flatMe => {
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

function segmentChangesDataSource(segmentName) {
  const since = cache.get(segmentName) || -1;

  return greedyFetch(since, segmentName).then((changes) => {
    let len = changes.length;

    if (len > 0) {
      cache.set(segmentName, changes[len - 1].till);

      return segmentMutatorFactory(changes);
    }
  });
}

module.exports = segmentChangesDataSource;
module.exports.greedyFetch = greedyFetch;
module.exports.cache = cache;
