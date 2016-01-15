'use strict';

var writer = require('split-cache').writer;

var core = {
  schedule(fn /*: function */, delay /*: number */, ...params /*:? Array<any> */) {
    setTimeout(fn, delay, ...params);
  },

  start(authorizationKey /*: string */) {
    return writer(authorizationKey).then(storage => {
      if (process.env.NODE_ENV === 'development') {
        storage.print();
      }

      // fire cache updater each 5 seconds
      this.schedule(writer, 5000, authorizationKey);

      return storage;
    });
  }
};

module.exports = core;
