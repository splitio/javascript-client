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

var Split = require('@splitsoftware/splitio-engine');
var parse = Split.parse;

/*::
type PartitionDTO = {
  treatment: string,
  size: number
};

type MatcherType = 'WHITELIST' | 'IN_SEGMENT' | 'ALL_KEYS' | 'BETWEEN' |
                   'GREATER_THAN_OR_EQUAL_TO' | 'LESS_THAN_OR_EQUAL_TO' |
                   'EQUAL_TO';

type MatcherDTO = {
  matcherType: MatcherType,
  negate: boolean,
  userDefinedSegmentMatcherData: ? {
    segmentName: string
  },
  whitelistMatcherData: ? Array<string>,
  unaryNumericMatcherData: ? number,
  betweenMatcherData: ? {
    dataType: null | 'number' | 'datetime',
    start: number,
    end: number
  }
};

type MatcherGroupDTO = {
  combiner: 'AND',
  matchers: Array<MatcherDTO>
};

type ConditionDTO = {
  matcherGroup: MatcherGroupDTO,
  partitions: Array<PartitionDTO>
};

type SplitDTO = {
  name: string,
  seed: number,
  status: string,
  killed: boolean,
  defaultTreatment: string,
  conditions: Array<ConditionDTO>
};

type SplitDTOCollection = Array<SplitDTO>;
*/

function SplitMutationsFactory(splits /*: SplitDTOCollection */) /*: Function */{
  function splitMutations(storage, storageMutator /*: Function */) /*: void */{
    storageMutator(splits.map(function (split) {
      return parse(split, storage);
    }));
  }

  return splitMutations;
}

module.exports = SplitMutationsFactory;