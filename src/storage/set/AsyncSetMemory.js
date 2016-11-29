// @flow

'use strict';

class AsyncSetMemory {
  collection: Set<string>;

  constructor() {
    this.collection = new Set();
  }

  add( values : Array<string> ) : Promise<number> {
    values.forEach( v => this.collection.add(v) );

    return Promise.resolve(1);
  }

  remove( values : Array<string> ) : Promise<number> {
    values.forEach( v => this.collection.delete(v) );

    return Promise.resolve(1);
  }

  has( values : Array<string> ) : Promise<Array<boolean>> {
    return Promise.resolve(
      values.map( v => this.collection.has(v) )
    );
  }
}

module.exports = AsyncSetMemory;
