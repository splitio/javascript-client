require('isomorphic-fetch');

function TrackedRequest(tracker) {
  return function RequestFactory(request /*: Request */) /*: Promise */ {
    let stop = tracker.timer('request').start();

    return fetch(request)
      .then(response => {
        tracker.counter(response.status).inc();
      })
      .then(response => response.json())
      .then(object => {
        stop();

        return object;
      })
      .catch(error => {
        tracker.counter(response.status).inc();
        stop();

        return undefined;
      });
  };
}

module.exports = TrackedRequest;
