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
declare interface SplitCache {
  addSplit(splitName : string , split : string) : boolean;
  removeSplit(splitName : string) : boolean;
  setChangeNumber(changeNumber : number) : boolean;
  getChangeNumber() : number;
  getSplit(splitName : string) : string;
}

declare interface SegmentCache {
  addToSegment(segmentName : string, segmentKeys : Array<string>) : boolean;
  removeFromSegment(segmentName : string, segmentKeys : Array<string>) : boolean;
  isInSegment(segmentName : string, key : string) : boolean;
  setChangeNumber(segmentName : string, changeNumber : number) : boolean;
  getChangeNumber(segmentName : string) : number
}
