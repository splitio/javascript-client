import { isString, isNumber, uniqO } from '../../utils/lang';
import logFactory from '../../utils/logger';
import {
  validateEvent,
  validateEventValue,
  validateEventProperties,
} from '../../utils/inputValidation';
const log = logFactory('splitio-ga-to-split');

/**
 * Provides a plugin to use with analytics.js, accounting for the possibility
 * that the global command queue has been renamed or not yet defined.
 * @param {string} pluginName The plugin name identifier.
 * @param {Function} pluginConstructor The plugin constructor function.
 */
function providePlugin(pluginName, pluginConstructor) {
  const gaAlias = window.GoogleAnalyticsObject || 'ga';
  window[gaAlias] = window[gaAlias] || function (...args) {
    (window[gaAlias].q = window[gaAlias].q || []).push(args);
  };

  // provides the plugin for use with analytics.js.
  window[gaAlias]('provide', pluginName, pluginConstructor);

  // @TODO should we registers the plugin on the global gaplugins object?
  // window.gaplugins = window.gaplugins || {};
  // window.gaplugins[capitalize(pluginName)] = pluginConstructor;
}

// Default filter: accepts all hits
function defaultFilter() { return true; }

// Default mapping: object used for building the default mapper from hits to Split events
// @TODO review default mapping. 
const defaultMapping = {
  eventTypeIdPrefix: {
    pageview: 'ga-pageview',
    screenview: 'ga-screenview',
    event: 'ga-event',
    social: 'ga-social',
    timing: 'ga-timing',
    transaction: 'ga-transaction',
    item: 'ga-item',
    exception: 'ga-exception',
  },
  eventTypeId: {
    // pageview: 'page',
    // screenview: 'screenName',
    event: 'eventAction',
    social: 'socialAction',
    // timing: 'timingVar',
  },
  eventValue: {
    event: 'eventValue',
    timing: 'timingValue',
  },
  eventProperties: {
    pageview: ['page'],
    screenview: ['screenName'],
    event: ['eventCategory', 'eventLabel'],
    social: ['socialNetwork', 'socialTarget'],
    timing: ['timingCategory', 'timingVar', 'timingLabel'],
  }
};

/**
 * Build a mapper function based on a mapping object
 * 
 * @param {object} mapping 
 */
function mapperBuilder(mapping) {
  return function (model) {
    var hitType = model.get('hitType');
    var eventTypeId =
      (mapping.eventTypeIdPrefix[hitType] || 'ga') + '.' +
      (model.get(mapping.eventTypeId[hitType]) || '');
    var value = model.get(mapping.eventValue[hitType]);
    var properties = {};
    var fields = mapping.eventProperties[hitType];
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

const defaultMapper = mapperBuilder(defaultMapping);

/**
 * Return a new list of identities removing invalid and duplicated ones.
 * 
 * @param {Array} identities list of identities
 * @returns list of valid and unique identities, or undefined if `identities` is not an array.
 */
function validateIdentities(identities) {
  if (!Array.isArray(identities))
    return undefined;

  // Remove duplicated identities  
  const uniqueIdentities = uniqO(identities);

  // Filter based on rum-agent identities validator
  return uniqueIdentities.filter(identity => {
    if (!identity)
      return false;

    const maybeKey = identity.key;
    const maybeTT = identity.trafficType;

    if (!isString(maybeKey) && !isNumber(maybeKey))
      return false;
    if (!isString(maybeTT))
      return false;

    return true;
  });
}

/**
 * Validates if a given object is a EventData instance, and logs corresponding warnings.
 * 
 * @param {EventData} data event data instance to validate. Precondition: data != undefined
 * @returns {boolean} Whether the data instance is a valid EventData or not.
 */
function validateEventData(data) {
  const event = validateEvent(data.eventTypeId, 'splitio-ga-to-split:mapper');
  const eventValue = validateEventValue(data.value, 'splitio-ga-to-split:mapper');
  const { properties } = validateEventProperties(data.properties, 'splitio-ga-to-split:mapper');

  return (event && eventValue !== false && properties !== false);
}

/**
 * GaToSplit integration.
 * This function provides the SplitTracker plugin to ga command queue.
 * 
 * @param {object} sdkOptions options passed at the SDK integrations settings
 * @param {object} storage SDK storage passed to track events
 * @param {object} coreSettings core settings used to define an identity if no one provided as SDK or plugin options
 */
function GaToSplit(sdkOptions, storage, coreSettings) {

  const defaultOptions = {
    filter: defaultFilter,
    mapper: defaultMapper,
    prefix: '',
    // Default eventHandler stores event
    eventHandler: function (event) {
      storage.events.track(event);
    },
    // We set default identities if key and TT are present in settings.core
    identities: (coreSettings.key && coreSettings.trafficType) ?
      [{ key: coreSettings.key, trafficType: coreSettings.trafficType }] :
      undefined
  };

  class SplitTracker {

    // Constructor for the SplitTracker plugin.
    constructor(tracker, pluginOptions) {

      // precedence of options: SDK options (config.integrations) overwrite pluginOptions (`ga('require', 'splitTracker', pluginOptions)`)
      const opts = Object.assign({}, defaultOptions, pluginOptions, sdkOptions);

      this.tracker = tracker;

      // Validate identities
      const validIdentities = validateIdentities(opts.identities);

      if (!validIdentities || validIdentities.length === 0) {
        log.warn('No valid identities were provided. Please check that you are passing a valid list of identities or providing a traffic type at the SDK configuration.');
        return;
      }

      const invalids = validIdentities.length - opts.identities.length;
      if (invalids) {
        log.warn(`${invalids} identities were discarded because they are invalid or duplicated. Identities must be an array of objects with key and trafficType.`);
      }
      opts.identities = validIdentities;

      // Overwrite sendHitTask to perform plugin tasks:
      // 1) filter hits
      // 2) map hits to Split events
      // 3) handle events, i.e., send them to Split BE
      const originalSendHitTask = tracker.get('sendHitTask');
      tracker.set('sendHitTask', function (model) {
        originalSendHitTask(model);

        // filter and map hits into an EventContent instance
        const eventContent = opts.filter(model) && opts.mapper(model);

        // don't send the event if it is falsy or invalid when generated by a custom mapper
        if (!eventContent || (opts.mapper !== defaultMapper && !validateEventData(eventContent)))
          return;

        // Store an event (eventHandler) for each Key-TrafficType pair (identities) 
        const timestamp = Date.now();
        opts.identities.forEach(identity => {
          const event = Object.assign({
            key: identity.key,
            trafficTypeName: identity.trafficType,
            timestamp,
          }, eventContent);
          opts.eventHandler(event, model);
        });
      });
    }

  }

  // Register the plugin, even if config is invalid, since, if not provided, it will block `ga` command queue.
  providePlugin('splitTracker', SplitTracker);
}

export default GaToSplit;