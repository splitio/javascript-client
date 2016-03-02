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
