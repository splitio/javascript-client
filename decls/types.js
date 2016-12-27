// @flow

type AsyncValue<T> = Promise<T> | T;

/**
 * Split Cache interfaces
 */
declare type SplitCacheKey = string;
declare type SplitCacheValue = string;

declare interface SplitCache {
  addSplit(splitName : string , split : string) : AsyncValue<boolean>;
  removeSplit(splitName : string) : AsyncValue<number>;
  getSplit(splitName : string) : AsyncValue<?string>;

  setChangeNumber(changeNumber : number) : AsyncValue<boolean>;
  getChangeNumber() : AsyncValue<number>;

  getAll() : Iterator<string>;
}

declare interface SegmentCache {
  addToSegment(segmentName : string, segmentKeys : Array<string>): AsyncValue<boolean>;
  removeFromSegment(segmentName : string, segmentKeys : Array<string>): AsyncValue<boolean>;
  isInSegment(segmentName : string, key : string): AsyncValue<boolean>;

  setChangeNumber(segmentName : string, changeNumber : number): AsyncValue<boolean>;
  getChangeNumber(segmentName : string): AsyncValue<number>;
}

/**
 * Manager API
 */
declare type FormattedSplit = {
  // Split Name
  name : string;
  // Name of the traffic type
  trafficType : string;
  // Is it killed
  killed : boolean;
  // List of available treatments
  treatments : Array<string>;
  // Current change number value
  changeNumber : number;
}

declare interface SplitManager {
   //  Returns all features with status ACTIVE
   splits() : Array<FormattedSplit>;
}

/**
 * Split Client API.
 */
declare type SplitClient = {
  getTreatment(key: string, splitName: string, attributes: Object) : string
}

// -----------------------------------------------------------------------------
// Services
// -----------------------------------------------------------------------------

/**
 * Segment Changes Service
 */
declare type SegmentChangesDTO = {
  name: string,
  added: Array<string>,
  removed: Array<string>,
  since: number,
  till: number
};

declare type SegmentChanges = Array<SegmentChangesDTO>;

/**
 * My Segments Service
 */
declare type MySegments = Array<string>;

/**
 * Split Changes Service
 */
declare type Partition = {|
  treatment: string,
  size: number
|};

declare type MatcherType = 'WHITELIST' | 'IN_SEGMENT' | 'ALL_KEYS' | 'BETWEEN' |
                           'GREATER_THAN_OR_EQUAL_TO' | 'LESS_THAN_OR_EQUAL_TO' |
                           'EQUAL_TO';

declare type Matcher = {|
  matcherType: MatcherType,
  negate: boolean,
  userDefinedSegmentMatcherData: ?{|
    segmentName: string
  |},
  whitelistMatcherData: ?Array<string>,
  unaryNumericMatcherData: ?number,
  betweenMatcherData: ?{|
    dataType: null | 'number' | 'datetime',
    start: number,
    end: number
  |}
|};

declare type MatcherGroup = {|
  combiner: 'AND',
  matchers: Array<Matcher>
|};

declare type Condition = {|
  matcherGroup: MatcherGroup,
  partitions: Array<Partition>
|};

// @todo review declaration with backend enums
declare type SplitStatus = 'ACTIVE' | 'KILLED' | 'ARCHIVED';

declare type SplitObject = {|
  trafficTypeName: string,
  name: string,
  seed: number,
  changeNumber: number,
  label: string,
  status: SplitStatus,
  killed: boolean,
  defaultTreatment: string,
  conditions: Array<Condition>
|};

declare type SplitChanges = {|
  splits: Array<SplitObject>,
  since: number,
  till: number
|};

/**
 * Storage
 */
declare type Storage = {|
  splits: SplitCache,
  segments: SegmentCache
|};
