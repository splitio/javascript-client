// @flow

'use strict';

class AsyncMapLocalStorage {

  set(key : string, value : string) : Promise<boolean> {
    let success = true;
    try {
      localStorage.setItem(key, value);
    } catch(e) {
      success = false;
    }

    return Promise.resolve(success);
  }

  get(key : string) : Promise<?string> {
    let v = null;

    try {
      v = localStorage.getItem(key);
    } catch(e) {}

    return Promise.resolve(v);
  }

  remove(key : string) : Promise<number> {
    let err = 1;
    try {
      localStorage.removeItem(key);
    } catch(e) {
      err = 0;
    }

    return Promise.resolve( err );
  }
}

module.exports = AsyncMapLocalStorage;
