// @flow

/**
 * Async data structures.
 */
declare interface AsyncMap {
  set( key : string, value : string ) : Promise<boolean>;
  get( key : string ) : Promise<?string>;
  remove( key : string ) : Promise<number>;
}

declare interface AsyncSet {
  add( values : Array<string> ) : Promise<number>;
  remove( values : Array<string> ) : Promise<number>;
  has( values : Array<string> ) : Promise<Array<boolean>>;
}

/**
 * Split Cache interfaces
 */
declare type SplitCacheKey = string;
declare type SplitCacheValue = string;

declare interface SplitCache {
  addSplit(splitName : string , split : string) : Promise<boolean>;
  removeSplit(splitName : string) : Promise<number>;
  getSplit(splitName : string) : Promise<?string>;

  setChangeNumber(changeNumber : number) : Promise<boolean>;
  getChangeNumber() : Promise<?number>;

  getAll() : Iterator<string>;
}

declare interface SegmentCache {
  addToSegment(segmentName : string, segmentKeys : Array<string>) : boolean;
  removeFromSegment(segmentName : string, segmentKeys : Array<string>) : boolean;
  isInSegment(segmentName : string, key : string) : boolean;

  setChangeNumber(segmentName : string, changeNumber : number) : boolean;
  getChangeNumber(segmentName : string) : number;
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
 * SplitChanges object
 */
declare type SplitObject = {
  trafficTypeName: string,
  name: string,
  seed: number,
  status: string,
  killed: boolean,
  defaultTreatment: string,
  changeNumber: number,
  conditions: Array<MatcherGroup>
};

declare type MatcherGroup = {
  combiner: string,
  matchers: Array<Matcher>,
  partitions: Array<Partition>
};

declare type Matcher = {
  keySelector: KeySelector,
  matcherType: string,
  negate: boolean,
  userDefinedSegmentMatcherData: any,
  whitelistMatcherData: any,
  unaryNumericMatcherData: any,
  betweenMatcherData: any
};

declare type KeySelector = {
  trafficType: string,
  attribute: ?string
};

declare type Partition = {
  treatment: string,
  size: number
};
