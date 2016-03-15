'use strict';

var log = require('debug')('splitio-cache:updater'); /**
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

var mySegmentsDataSource = require('../ds/mySegments');

var storage = require('../storage');
var segmentsStorage = storage.segments;
var update = segmentsStorage.update.bind(segmentsStorage);

function mySegmentsUpdater(_ref) {
  var authorizationKey = _ref.authorizationKey;
  var key = _ref.key;

  log('[' + authorizationKey + '] Updating mySegments');

  return mySegmentsDataSource({ authorizationKey: authorizationKey, key: key }).then(function (segmentsMutator) {
    return segmentsMutator(update);
  }).then(function () {
    return storage;
  });
}

module.exports = mySegmentsUpdater;
//# sourceMappingURL=mySegments.js.map