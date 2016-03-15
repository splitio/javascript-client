'use strict';

var splitChangesService = require('@splitsoftware/splitio-services/lib/splitChanges'); /**
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

var splitChangesRequest = require('@splitsoftware/splitio-services/lib/splitChanges/get');

var splitMutatorFactory = require('../mutators/splitChanges');

var since = -1;

function splitChangesDataSource() {
  return splitChangesService(splitChangesRequest({
    since: since
  })).then(function (resp) {
    return resp.json();
  }).then(function (json) {
    var till = json.till;
    var splits = json.splits;


    since = till;

    return splitMutatorFactory(splits);
  }).catch(function () {/* noop */});
}

module.exports = splitChangesDataSource;
//# sourceMappingURL=splitChanges.js.map