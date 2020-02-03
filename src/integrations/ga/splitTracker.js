
import logFactory from '../../utils/logger';
const log = logFactory('splitio');

export default class SplitTrackerManager {

  // @TODO check provide.js at autotrack
  static providePlugin(pluginName, pluginConstructor) {
    var ga = window[window['GoogleAnalyticsObject'] || 'ga'];
    if (typeof ga == 'function') {
      ga('provide', pluginName, pluginConstructor);
    }
  }

  static defaultHitFilter() {
    return true;
  }

  static defaultHitMapper(options) {
    var defaultOptions = {
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
    const opts = Object.assign({}, defaultOptions, options);

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
        value: value,
        properties: properties
      };
    };
  }

  constructor(sdkOptions) {
    // Constructor for the SplitTracker plugin.

    function SplitTracker(tracker, pluginOptions) {

      const opts = Object.assign({
        hitFilter: SplitTrackerManager.defaultHitFilter,
        hitMapper: SplitTrackerManager.defaultHitMapper(),
      }, pluginOptions, sdkOptions);

      this.tracker = tracker;

      // @TODO review error condition and message
      if (!opts.identities || sdkOptions.identities.length === 0) {
        log.error('A traffic type is required for tracking GA hits as Split events');
      }      

      // Overwrite sendHitTask to perform plugin tasks:
      // 1) filter hits
      // 2) map hits to Splitevents
      // 3) handle events, i.e., send them to Split BE
      const originalSendHitTask = tracker.get('sendHitTask');
      tracker.set('sendHitTask', function (model) {
        originalSendHitTask(model);
        if (opts.hitFilter(model)) {
          const eventData = opts.hitMapper(model);
          if (opts.eventHandler) {
            const timestamp = Date.now();
            for (let i = 0; i < opts.identities.length; i++) {
              const identity = opts.identities[i];
              const event = Object.assign({
                key: identity.key,
                trafficTypeName: identity.trafficType,
                timestamp,
              }, eventData);
              opts.eventHandler(event, model);
            }
          }
        }
      });
    }

    // Register the plugin, even if config is invalid, since, if not provided, it will block `ga` command queue.
    SplitTrackerManager.providePlugin('splitTracker', SplitTracker);

  }

}
