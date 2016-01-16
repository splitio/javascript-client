'use strict';

var updater = require('splitio-cache');

var core = {
  schedule(fn /*: function */, delay /*: number */, ...params /*:? Array<any> */) {
    setTimeout(() => {
      fn(...params);
      this.schedule(fn, delay, ...params);
    }, delay);
  },

  start(authorizationKey /*: string */) {
    return updater(authorizationKey).then(storage => {
      if (process.env.NODE_ENV === 'development') {
        storage.print();
      }

      // fire cache updater each 5 seconds
      this.schedule(updater, 5000, authorizationKey);

      return storage;
    });
  }
};

module.exports = core;
