'use strict';

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

var mySegmentsService = require('@splitsoftware/splitio-services/lib/mySegments');
var mySegmentsRequest = require('@splitsoftware/splitio-services/lib/mySegments/get');

var mySegmentMutationsFactory = require('../mutators/mySegments');

function mySegmentsDataSource() {
  return mySegmentsService(mySegmentsRequest()).then(function (resp) {
    return resp.json();
  }).then(function (json) {
    return mySegmentMutationsFactory(json.mySegments.map(function (segment) {
      return segment.name;
    }));
  }).catch(function () {
    debugger;
  });
}

module.exports = mySegmentsDataSource;
//# sourceMappingURL=mySegments.js.map