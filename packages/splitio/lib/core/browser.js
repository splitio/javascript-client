/* @flow */'use strict';

var updater = require('splitio-cache');

var core = {
  schedule: function schedule(fn /*: function */, delay /*: number */) /*:? Array<any> */{
    for (var _len = arguments.length, params = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      params[_key - 2] = arguments[_key];
    }

    var _this = this;

    setTimeout(function () {
      fn.apply(undefined, params);
      _this.schedule.apply(_this, [fn, delay].concat(params));
    }, delay);
  },
  start: function start(authorizationKey /*: string */) {
    var _this2 = this;

    return updater(authorizationKey).then(function (storage) {
      if (process.env.NODE_ENV === 'development') {
        console.log(JSON.stringify(storage.segments));
        console.log(JSON.stringify(storage.splits));
      }

      // fire cache updater each 5 seconds
      _this2.schedule(updater, 5000, authorizationKey);

      return storage;
    });
  }
};

module.exports = core;
//# sourceMappingURL=browser.js.map