// @flow

'use strict';

type LocalStorageOperation = "add" | "delete";

const getItem = (key : string) : string => {
  const v = localStorage.getItem(key);

  return v || '[]';
};

const buildSet = (key : string) : Set<string> => {
  const v = JSON.parse( getItem(key) );

  return new Set( v[Symbol.iterator]() );
};

const mutation = (key : string, values : Array<string>, op : LocalStorageOperation) => {
  const collection = buildSet(key);

  values.forEach(v => collection[op](v));

  localStorage.setItem(key, JSON.stringify(collection));
};

class AsyncSetLocalStorage {
  key : string;

  constructor(key : string) {
    this.key = key;
  }

  add(values : Array<string>) : Promise<number> {
    return new Promise((resolve, reject) => {
      try {
        mutation(this.key, values, 'add');
        resolve(1);
      } catch(e) {
        reject(e);
      }
    });
  }

  remove(values : Array<string>) : Promise<number> {
    return new Promise((resolve, reject) => {
      try {
        mutation(this.key, values, 'delete');
        resolve(1);
      } catch(e) {
        reject(e);
      }
    });
  }

  has(values : Array<string>) : Promise<Array<boolean>> {
    const collection = buildSet(this.key);
    const checks = values.map( v => collection.has(v) );

    return Promise.resolve(checks);
  }
}

module.exports = AsyncSetLocalStorage;
