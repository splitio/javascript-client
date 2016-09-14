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

/*::
type MySegmentsDTO = Array<string>;
*/
function MySegmentMutationsFactory(
  mySegments /*: MySegmentsDTO */
) /*: Function */ {

  return function segmentMutations(storage /*: Object */) /*: void */ {
    const nextSegments = new Set(mySegments);
    const sameAmountOfElements = storage.segments.size === nextSegments.size;
    let isEqual = true;
    let shouldUpdate = false;

    for (let i = 0; i < mySegments.length && isEqual; i++) {
      isEqual = storage.segments.has(mySegments[i]);
    }

    shouldUpdate = !isEqual || !sameAmountOfElements;

    if (shouldUpdate) {
      storage.segments.update(nextSegments);
    }

    return shouldUpdate;
  };

}

module.exports = MySegmentMutationsFactory;
