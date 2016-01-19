/* @flow */ 'use strict';

let updater = require('splitio-cache');

let core = {
  schedule(fn /*: function */, delay /*: number */, ...params /*:? Array<any> */) {
    setTimeout(() => {
      fn(...params);
      this.schedule(fn, delay, ...params);
    }, delay);
  },

  start(authorizationKey /*: string */) {
    return updater(authorizationKey).then(storage => {
      if (process.env.NODE_ENV === 'development') {
        console.log(JSON.stringify( storage.segments ));
        console.log(JSON.stringify( storage.splits ));
      }

      // fire cache updater each 5 seconds
      this.schedule(updater, 5000, authorizationKey);

      return storage;
    });
  }
};

module.exports = core;
