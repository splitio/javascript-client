// @flow

'use strict';

class AsyncMapMemory {
  map: Map<string, string>;

  constructor() {
    this.map = new Map();
  }

  set(key : string, value : string) : Promise<boolean> {
    this.map.set(key, value);

    return Promise.resolve(true);
  }

  get(key : string) : Promise<?string> {
    return Promise.resolve( this.map.get(key) );
  }

  remove(key : string) : Promise<number> {
    return Promise.resolve( this.map.delete(key) ? 1 : 0 );
  }
}

module.exports = AsyncMapMemory;
