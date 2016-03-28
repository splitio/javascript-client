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

function SegmentMutationsFactory(changes /*: SegmentChangesDTOCollection */) /*: Function */ {
  function segmentMutations(storageAccesor /*: Function */, storageMutator /*: Function*/) /*: void */ {
    changes.forEach(({name, added, removed}) => {
      let segment;

      // nothing to do here
      if (added.length === 0 && removed.length === 0) {
        return;
      }

      segment = storageAccesor(name);

      added.forEach(key => segment.add(key));
      removed.forEach(key => segment.delete(key));

      storageMutator(name, segment);
    });
  }

  return segmentMutations;
}

module.exports = SegmentMutationsFactory;
