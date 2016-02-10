/* @flow */ 'use strict';

let updater = require('@splitsoftware/splitio-cache');

let core = {
  schedule(fn /*: function */, delay /*: number */, ...params /*:? Array<any> */) {
    setTimeout(() => {
      fn(...params);
      this.schedule(fn, delay, ...params);
    }, delay);
  },

  start(...args) {
    return updater(...args).then(storage => {
      // fire cache updater each 60 seconds
      this.schedule(updater, 60000, ...args);

      return storage;
    });
  }
};

module.exports = core;
