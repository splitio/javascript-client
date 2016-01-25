/* @flow */'use strict';

var updater = require('@splitsoftware/splitio-cache');

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
  start: function start() {
    var _this2 = this;

    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    return updater.apply(undefined, args).then(function (storage) {
      // fire cache updater each 5 seconds
      _this2.schedule.apply(_this2, [updater, 5000].concat(args));

      return storage;
    });
  }
};

module.exports = core;
//# sourceMappingURL=browser.js.map