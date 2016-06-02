"use strict";

var _set = require("babel-runtime/core-js/set");

var _set2 = _interopRequireDefault(_set);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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

/*::
type MySegmentsDTO = Array<string>;
*/
module.exports = function MySegmentMutationsFactory(mySegments /*: MySegmentsDTO */
) /*: Function */{

  return function segmentMutations(storage /*: Object */) /*: void */{
    var nextSegments = new _set2.default(mySegments);
    var isEqual = true;
    var shouldUpdate = void 0;

    // weak logic for performance
    for (var i = 0; i < mySegments.length && isEqual; i++) {
      isEqual = storage.segments.has(mySegments[i]);
    }

    shouldUpdate = !isEqual;

    if (shouldUpdate) {
      storage.segments.update(nextSegments);
    }

    return shouldUpdate;
  };
};