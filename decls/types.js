// @flow

declare type AsyncValue<T> = Promise<T> | T;

/**
 * Cache interfaces
 */
declare interface SplitCache {
  addSplit(splitName: string , split: string): AsyncValue<boolean>;
  addSplits(splitName: Array<string> , split: Array<string>): AsyncValue<boolean>;

  removeSplit(splitName: string): AsyncValue<number>;
  removeSplits(names: Array<string>): AsyncValue<number>;

  getSplit(splitName: string): AsyncValue<?string>;

  setChangeNumber(changeNumber: number): AsyncValue<boolean>;
  getChangeNumber(): AsyncValue<number>;

  getAll(): AsyncValue<Array<string>>;
}

declare interface SegmentCache {
  addToSegment(segmentName: string, segmentKeys: Array<string>): AsyncValue<boolean>;
  removeFromSegment(segmentName: string, segmentKeys: Array<string>): AsyncValue<boolean>;
  isInSegment(segmentName: string, key: string): AsyncValue<boolean>;

  setChangeNumber(segmentName: string, changeNumber: number): AsyncValue<boolean>;
  getChangeNumber(segmentName: string): AsyncValue<number>;

  registerSegment(segment: string): AsyncValue<boolean>;
  registerSegments(segments: Iterable<string>): AsyncValue<boolean>;
  getRegisteredSegments(): AsyncValue<Iterable<string>>;
}

/**
 * Manager API
 */
declare type FormattedSplit = {
  // Split Name
  name: string;
  // Name of the traffic type
  trafficType: string;
  // Is it killed
  killed: boolean;
  // List of available treatments
  treatments: Array<string>;
  // Current change number value
  changeNumber: number;
};

declare interface SplitManager {
   //  Returns all features with status ACTIVE
   splits(): Array<FormattedSplit>;
};

/**
 * Split Client API.
 */
declare type SplitClient = {
  getTreatment(key: string, splitName: string, attributes: ?Object): Promise<string>
};

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
declare type Partition = {
  treatment: string,
  size: number
};

declare type MatcherType = 'WHITELIST' | 'IN_SEGMENT' | 'ALL_KEYS' | 'BETWEEN' |
                           'GREATER_THAN_OR_EQUAL_TO' | 'LESS_THAN_OR_EQUAL_TO' |
                           'EQUAL_TO';

declare type UserDefinedSegmentMatcher = {
  segmentName: string
};

declare type BetweenMatcher = {
  dataType: null | 'number' | 'datetime',
  start: number,
  end: number
};

declare type Matcher = {
  matcherType: MatcherType,
  negate: boolean,
  userDefinedSegmentMatcherData: UserDefinedSegmentMatcher,
  whitelistMatcherData: Array<string>,
  unaryNumericMatcherData: number,
  betweenMatcherData: BetweenMatcher
};

declare type MatcherGroup = {
  combiner: 'AND',
  matchers: Array<Matcher>
};

declare type Condition = {
  matcherGroup: MatcherGroup,
  partitions: Array<Partition>
};

// @todo review declaration with backend enums
declare type SplitStatus = 'ACTIVE' | 'KILLED' | 'ARCHIVED';

declare type SplitObject = {
  trafficTypeName: string,
  name: string,
  seed: number,
  changeNumber: number,
  label: string,
  status: SplitStatus,
  killed: boolean,
  defaultTreatment: string,
  conditions: Array<Condition>
};

declare type SplitChanges = {
  splits: Array<SplitObject>,
  since: number,
  till: number
};

/**
 * Split Storage
 */
declare type SplitStorage = {
  splits: SplitCache,
  segments: SegmentCache
};

/**
 * IORedis
 */
declare interface IORedisQueue {
  exec(): Promise<Array<[any, string]>>
}

declare interface IORedis {
  keys(pattern: string): Promise<Array<string>>;

  sadd(key: string, value: any): Promise<string>;
  srem(key: string, value: any): Promise<string>;
  sismember(key: string, value: string): Promise<number>;
  smembers(key: string): Promise<Array<string>>;

  set(key: string, value: any): Promise<string>;
  get(key: string): Promise<string>;
  del(key: string): Promise<number>;
  del(key: Array<string>): Promise<number>;

  pipeline(cmd: Array<[string, string, ?string]>): IORedisQueue;

  flushdb(): Promise<string>;
}
