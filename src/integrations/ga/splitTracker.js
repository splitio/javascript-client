// CHECK provide.js at autotrack
export function requirePlugin(pluginName, pluginOptions = {}, trackerNames = ['auto']) {
  var ga = window[window['GoogleAnalyticsObject'] || 'ga'];
  if (typeof ga == 'function') {
    for (let index = 0; index < trackerNames.length; index++) {
      ga(trackerNames[index] + '.require', pluginName, pluginOptions);
    }
  } else {
    // TODO: log warning 'ga Command Queue not found'
  }
}

export function providePlugin(pluginName, pluginConstructor) {
  var ga = window[window['GoogleAnalyticsObject'] || 'ga'];
  if (typeof ga == 'function') {
    ga('provide', pluginName, pluginConstructor);
  }
}

function defaultHitFilter() {
  return true;
}

function defaultHitMapper(options) {
  var defaultOptions = {
    key: undefined,
    fieldKey: 'clientId',
    trafficTypeName: 'user',
    eventTypeIdPrefix: {
      pageview: 'ga-pageview',
      screenview: 'ga-screenview',
      event: 'ga-event',
      social: 'ga-social',
      timing: 'ga-timing',
    },
    eventTypeId: {
      pageview: 'page',
      screenview: 'screenName',
      event: 'eventAction',
      social: 'socialAction',
      timing: 'timingVar',
    },
    eventValue: {
      event: 'eventValue',
      timing: 'timingValue',
    },
    eventProperties: {
      event: ['eventCategory', 'eventLabel'],
      social: ['socialNetwork', 'socialTarget'],
      timing: ['timingCategory', 'timingLabel'],
    }
  };
  const opts = Object.assign(defaultOptions, options);

  return function (model) {

    var hitType = model.get('hitType');
    var eventTypeId =
      (opts.eventTypeIdPrefix[hitType] || 'ga') + '.' +
      (model.get(opts.eventTypeId[hitType]) || '');
    var value = model.get(opts.eventValue[hitType]);
    var properties = {};
    var fields = opts.eventProperties[hitType];
    if (fields) {
      var length = fields.length;
      for (var i = 0; i < length; i++) {
        properties[fields[i]] = model.get(fields[i]);
      }
    }

    return {
      eventTypeId: eventTypeId,
      trafficTypeName: opts.trafficTypeName,
      value: value,
      timestamp: Date.now(),
      key: model.get(opts.fieldKey),
      properties: properties
    };
  };
}

// Post data to our BE with beacon API. If not Beacon API available, fallback to XHR.
function beaconPost(url, payload) {
  return navigator.sendBeacon ? navigator.sendBeacon(url, payload) : xhrPost(url, payload);
}

// XHR request fallback.
function xhrPost(url, payload) {
  try {
    var req = new XMLHttpRequest();
    req.open('POST', url, true);
    req.setRequestHeader('Content-Type', 'text/plain;charset=UTF-8');
    req.send(payload);
  } catch (e) {
    // noop
  }

  return true;
}

// `sendEvent` returns a eventHandler that perform beacon/xhr requests to send events, given an `authorizationKey`, and optional `sdk` name and `eventsUrl` URL
// This is usefull to use the plugin standalone.
export function sendEvent(authorizationKey, sdk = 'ga', eventsUrl = 'https://events.split.io/api/events/beacon') {
  // There's nothing to fallback for. Thus, we return a noop function as eventHandler
  if (!(navigator && navigator.sendBeacon) && (!XMLHttpRequest || typeof XDomainRequest !== 'undefined'))
    return function () { };

  return function (event, model) {
    const payload = JSON.stringify({
      entries: [event],
      token: authorizationKey,
      sdk: sdk,
    });
    return model.get('transport') === 'beacon' ? beaconPost(eventsUrl, payload) : xhrPost(eventsUrl, payload);
  };
}

export const defaultOptions = {
  hitFilter: defaultHitFilter,
  hitMapper: defaultHitMapper(),
  eventHandler: undefined,
};

/**
 * Constructor for the SplitTracker plugin.
 */
export function SplitTracker(tracker, options) {

  const opts = Object.assign(defaultOptions, options);

  this.tracker = tracker;

  // Overwrite sendHitTask to perform plugin tasks:
  // 1) filter hits
  // 2) map hits to Splitevents
  // 3) handle events, i.e., send them to Split BE
  const originalSendHitTask = this.tracker.get('sendHitTask');
  this.tracker.set('sendHitTask', function (model) {
    originalSendHitTask(model);
    if (opts.hitFilter(model)) {
      const event = opts.hitMapper(model);
      opts.eventHandler(event, model);
    }
  });
}
