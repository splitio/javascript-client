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
type SegmentChangesDTO = {
  name: string,
  added: Array<string>,
  removed: Array<string>
};

type SegmentChangesDTOCollection = Array<SegmentChangesDTO>;
*/
const log = require('debug')('splitio-cache:mutators');

function SegmentMutationsFactory(changes /*: SegmentChangesDTOCollection */) /*: Function */ {
  return function segmentMutations(storage /*: Object */) /*: void */ {
    changes.forEach(({name, added, removed}) => {
      const segment = storage.segments.get(name);

      log(`Adding ${added.length} new keys to the segment ${name}`);

      added.forEach(key => segment.add(key));

      log(`Removing ${removed.length} keys from segment ${name}`);

      removed.forEach(key => segment.delete(key));

      storage.segments.update(name, segment);
    });
  };
}

module.exports = SegmentMutationsFactory;
