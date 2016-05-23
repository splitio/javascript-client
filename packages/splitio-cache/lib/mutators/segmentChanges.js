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

/*::
type SegmentChangesDTO = {
  name: string,
  added: Array<string>,
  removed: Array<string>
};

type SegmentChangesDTOCollection = Array<SegmentChangesDTO>;
*/

var log = require('debug')('splitio-cache:mutators');

function SegmentMutationsFactory(changes /*: SegmentChangesDTOCollection */) /*: Function */{
  function segmentMutations(storageAccesor /*: Function */, storageMutator /*: Function*/) /*: void */{
    changes.forEach(function (_ref) {
      var name = _ref.name;
      var added = _ref.added;
      var removed = _ref.removed;

      var segment = void 0;

      // nothing to do here
      if (added.length === 0 && removed.length === 0) {
        log('There is none changes to be done to segment ' + name);
        return;
      }

      segment = storageAccesor(name);

      log('Adding ' + added.length + ' new keys to the segment ' + name);

      added.forEach(function (key) {
        return segment.add(key);
      });

      log('Removing ' + removed.length + ' keys from segment ' + name);

      removed.forEach(function (key) {
        return segment.delete(key);
      });

      storageMutator(name, segment);
    });
  }

  return segmentMutations;
}

module.exports = SegmentMutationsFactory;