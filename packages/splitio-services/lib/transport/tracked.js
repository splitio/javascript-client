/* @flow */'use strict';

require('isomorphic-fetch');

function TrackedRequest(tracker) {
  return function RequestFactory(request /*: Request */) /*: Promise */{
    var stop = tracker.timer('request').start();

    return fetch(request).then(function (response) {
      tracker.counter(response.status).inc();
    }).then(function (response) {
      return response.json();
    }).then(function (object) {
      stop();

      return object;
    }).catch(function (error) {
      tracker.counter(response.status).inc();
      stop();

      return undefined;
    });
  };
}

module.exports = TrackedRequest;
//# sourceMappingURL=tracked.js.map