// @flow

import type { EventEmitter } from 'events';

declare type AsyncValue<T> = Promise<T> | T;

/**
 * Cache interfaces
 */
declare interface SplitCache {
  addSplit(splitName: string , split: string): AsyncValue<boolean>;
  addSplits(entries: Array<[string, string]>): AsyncValue<Array<boolean>>;

  removeSplit(splitName: string): AsyncValue<number>;
  removeSplits(splitNames: Array<string>): AsyncValue<number>;

  getSplit(splitName: string): AsyncValue<?string>;

  setChangeNumber(changeNumber: number): AsyncValue<boolean>;
  getChangeNumber(): AsyncValue<number>;

  getAll(): AsyncValue<Array<string>>;
  getKeys(): AsyncValue<Array<string>>;
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

declare interface StatsCache {
  state(): Array<any>;
  track(t: any): StatsCache;
  clear(): StatsCache;
  isEmpty(): boolean;
  toJSON(): Array<any>;
}

declare interface Startable {
  start(): void;
  stop(): void;
}

/**
 * Manager API
 */
declare type SplitView = {
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
   splits(): Array<SplitView>;
   split(splitName: string): SplitView;
   names(): Array<string>;
};

/**
 * Split Client API.
 */
declare type SplitClient = {
  getTreatment(key: string, splitName: string, attributes: ?Object): Promise<string>;
  events(): EventEmitter;
  destroy(): void;
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
declare type DataType = 'NUMBER' | 'DATETIME' | 'STRING';

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
  dataType: DataType,
  start: number,
  end: number
};

declare type UnaryNumericMatcher = {
  dataType: DataType,
  value: string | number
};

declare type KeySelector = {
  attribute: string;
};

declare type Matcher = {
  matcherType: MatcherType,
  negate: boolean,
  keySelector: KeySelector,
  userDefinedSegmentMatcherData: UserDefinedSegmentMatcher,
  whitelistMatcherData: Array<string>,
  unaryNumericMatcherData: UnaryNumericMatcher,
  betweenMatcherData: BetweenMatcher
};

declare type MatcherGroup = {
  combiner: 'AND',
  matchers: Array<Matcher>
};

declare type Condition = {
  matcherGroup: MatcherGroup,
  partitions: Array<Partition>,
  label: string
};

declare type SplitStatus = 'ACTIVE' | 'ARCHIVED';

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

declare type ParsedMatcher = {
  attribute: string,
  negate: boolean,
  type: Symbol,
  value: any
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
  segments: SegmentCache,
  impressions: StatsCache<string>,
  metrics: StatsCache<number>,
  shared(): SplitStorage
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
};

/**
 * Key types
 */
declare type SplitKeyObject = {
  matchingKey: string,
  bucketingKey: string
};

declare type SplitKey = string | SplitKeyObject;

declare type Evaluation = {
  treatment: string,
  label: string
};

/**
 * Split Settings
 */
declare type Settings = {
  mode: 'consumer' | 'producer' | 'standalone',

  core: {
    authorizationKey: string,
    key: ?string,
    labelsEnabled: ?boolean
  },

  scheduler: {
    featuresRefreshRate: number,
    segmentsRefreshRate: number,
    metricsRefreshRate: number,
    impressionsRefreshRate: number
  },

  urls: {
    sdk: string,
    events: string
  },

  startup: {
    requestTimeoutBeforeReady: number,
    retriesOnFailureBeforeReady: number,
    readyTimeout: number
  },

  storage: {
    type: 'MEMORY' | 'LOCALSTORAGE' | 'REDIS',
    options: any
  },

  overrideKey(key: string): Settings,

  url(target: string): string
};

/**
 * Ready | Update event handlers
 */
declare type ReadinessGate = {
  splits: EventEmitter,
  segments: EventEmitter,
  gate: EventEmitter,
  destroy(): void
};
