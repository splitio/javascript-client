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

const Split = require('@splitsoftware/splitio-engine');
const parse = Split.parse;

type PartitionDTO = {
  treatment: string,
  size: number
};

type MatcherDTO = {
  matcherType: string,
  negate: boolean,
  userDefinedSegmentMatcherData: any,
  whitelistMatcherData: any
};

type MatcherGroupDTO = {
  combiner: string,
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

function SplitMutationsFactory(splits :SplitDTOCollection) :Function {
  function splitMutations(storage, storageMutator :Function) :void {
    storageMutator(splits.map(function(split) {
      return parse(split, storage);
    }));
  }

  return splitMutations;
}

module.exports = SplitMutationsFactory;
