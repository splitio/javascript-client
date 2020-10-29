import objectAssign from 'object-assign';
import { isString, numberIsFinite, unicAsStrings } from '../../utils/lang';
import logFactory from '../../utils/logger';
import {
  validateEvent,
  validateEventValue,
  validateEventProperties,
  validateKey,
  validateTrafficType,
} from '../../utils/inputValidation';
const logName = 'splitio-ga-to-split', logNameMapper = logName + ':mapper';
const log = logFactory(logName);

/**
 * Provides a plugin to use with analytics.js, accounting for the possibility
 * that the global command queue has been renamed or not yet defined.
 * @param {string} pluginName The plugin name identifier.
 * @param {Function} pluginConstructor The plugin constructor function.
 */
function providePlugin(pluginName, pluginConstructor) {
  // get reference to global command queue. Init it if not defined yet.
  const gaAlias = window.GoogleAnalyticsObject || 'ga';
  window[gaAlias] = window[gaAlias] || function (...args) {
    (window[gaAlias].q = window[gaAlias].q || []).push(args);
  };

  // provides the plugin for use with analytics.js.
  window[gaAlias]('provide', pluginName, pluginConstructor);
}

// Default mapping: object used for building the default mapper from hits to Split events
const defaultMapping = {
  eventTypeId: {
    event: 'eventAction',
    social: 'socialAction',
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
    exception: ['exDescription', 'exFatal'],
  }
};

/**
 * Build a mapper function based on a mapping object
 *
 * @param {object} mapping
 */
function mapperBuilder(mapping) {
  return function (model) {
    const hitType = model.get('hitType');

    const eventTypeId = model.get(mapping.eventTypeId[hitType] || 'hitType');

    const value = model.get(mapping.eventValue[hitType]);

    const properties = {};
    const fields = mapping.eventProperties[hitType];
    if (fields) {
      for (let i = 0; i < fields.length; i++) {
        properties[fields[i]] = model.get(fields[i]);
      }
    }

    return {
      eventTypeId,
      value,
      properties,
      timestamp: Date.now(),
    };
  };
}

// exposed for unit testing purposses.
export const defaultMapper = mapperBuilder(defaultMapping);

export const defaultPrefix = 'ga';

/**
 * Return a new list of identities removing invalid and duplicated ones.
 *
 * @param {Array} identities list of identities
 * @returns list of valid and unique identities. The list might be empty if `identities` is not an array or all its elements are invalid.
 */
export function validateIdentities(identities) {
  if (!Array.isArray(identities))
    return [];

  // Remove duplicated identities
  const uniqueIdentities = unicAsStrings(identities);

  // Filter based on rum-agent identities validator
  return uniqueIdentities.filter(identity => {
    if (!identity)
      return false;

    const maybeKey = identity.key;
    const maybeTT = identity.trafficType;

    if (!isString(maybeKey) && !numberIsFinite(maybeKey))
      return false;
    if (!isString(maybeTT))
      return false;

    return true;
  });
}

/**
 * Checks if EventData fields (except EventTypeId) are valid, and logs corresponding warnings.
 * EventTypeId is validated separately.
 *
 * @param {EventData} data event data instance to validate. Precondition: data != undefined
 * @returns {boolean} Whether the data instance is a valid EventData or not.
 */
export function validateEventData(eventData) {
  if (!validateEvent(eventData.eventTypeId, logNameMapper))
    return false;

  if (validateEventValue(eventData.value, logNameMapper) === false)
    return false;

  const { properties } = validateEventProperties(eventData.properties, logNameMapper);
  if (properties === false)
    return false;

  if (eventData.timestamp && !numberIsFinite(eventData.timestamp))
    return false;

  if (eventData.key && validateKey(eventData.key, logNameMapper) === false)
    return false;

  if (eventData.trafficTypeName && validateTrafficType(eventData.trafficTypeName, logNameMapper) === false)
    return false;

  return true;
}

const INVALID_PREFIX_REGEX = /^[^a-zA-Z0-9]+/;
const INVALID_SUBSTRING_REGEX = /[^-_.:a-zA-Z0-9]+/g;
/**
 * Fixes the passed string value to comply with EventTypeId format, by removing invalid characters and truncating if necessary.
 *
 * @param {string} eventTypeId string value to fix.
 * @returns {string} Fixed version of `eventTypeId`.
 */
export function fixEventTypeId(eventTypeId) {
  // return the input eventTypeId if it cannot be fixed
  if (!isString(eventTypeId) || eventTypeId.length === 0) {
    return eventTypeId;
  }

  // replace invalid substrings and truncate
  const fixed = eventTypeId
    .replace(INVALID_PREFIX_REGEX, '')
    .replace(INVALID_SUBSTRING_REGEX, '_');
  const truncated = fixed.slice(0, 80);
  if (truncated.length < fixed.length) log.warn('EventTypeId was truncated because it cannot be more than 80 characters long.');
  return truncated;
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
    prefix: defaultPrefix,
    // We set default identities if key and TT are present in settings.core
    identities: (coreSettings.key && coreSettings.trafficType) ?
      [{ key: coreSettings.key, trafficType: coreSettings.trafficType }] :
      undefined
  };

  class SplitTracker {

    // Constructor for the SplitTracker plugin.
    constructor(tracker, pluginOptions) {

      // precedence of options: SDK options (config.integrations) overwrite pluginOptions (`ga('require', 'splitTracker', pluginOptions)`)
      const opts = objectAssign({}, defaultOptions, sdkOptions, pluginOptions);

      this.tracker = tracker;

      // Validate identities
      const validIdentities = validateIdentities(opts.identities);

      if (validIdentities.length === 0) {
        log.warn('No valid identities were provided. Please check that you are passing a valid list of identities or providing a traffic type at the SDK configuration.');
        return;
      }

      const invalids = validIdentities.length - opts.identities.length;
      if (invalids) {
        log.warn(`${invalids} identities were discarded because they are invalid or duplicated. Identities must be an array of objects with key and trafficType.`);
      }
      opts.identities = validIdentities;

      // Validate prefix
      if (!isString(opts.prefix)) {
        log.warn('The provided `prefix` was ignored since it is invalid. Please check that you are passing a string object as `prefix`.');
        opts.prefix = undefined;
      }

      // Overwrite sendHitTask to perform plugin tasks:
      // 1) filter hits
      // 2) map hits to Split events
      // 3) handle events, i.e., validate and send them to Split BE
      const originalSendHitTask = tracker.get('sendHitTask');
      tracker.set('sendHitTask', function (model) {
        originalSendHitTask(model);

        // filter hit if `hits` flag is false or if it comes from Split-to-GA integration
        if (opts.hits === false || model.get('splitHit')) return;
        try {
          if (opts.filter && !opts.filter(model)) return;
        } catch (err) {
          log.warn(`GaToSplit custom filter threw: ${err}`);
          return;
        }

        // map hit into an EventData instance
        let eventData = defaultMapper(model);
        if (opts.mapper) {
          try {
            eventData = opts.mapper(model, eventData);
          } catch (err) {
            log.warn(`GaToSplit custom mapper threw: ${err}`);
            return;
          }
          if (!eventData)
            return;
        }

        // Add prefix. Nothing is appended if the prefix is falsy, e.g. undefined or ''.
        if (opts.prefix) eventData.eventTypeId = `${opts.prefix}.${eventData.eventTypeId}`;

        eventData.eventTypeId = fixEventTypeId(eventData.eventTypeId);

        if (!validateEventData(eventData))
          return;

        // Store the event
        if (eventData.key && eventData.trafficTypeName) {
          storage.events.track(eventData);
        } else { // Store the event for each Key-TT pair (identities), if key and TT is not present in eventData
          opts.identities.forEach(identity => {
            const event = objectAssign({
              key: identity.key,
              trafficTypeName: identity.trafficType,
            }, eventData);
            storage.events.track(event);
          });
        }
      });

      log.info('Started GA-to-Split integration');
    }

  }

  // Register the plugin, even if config is invalid, since, if not provided, it will block `ga` command queue.
  providePlugin('splitTracker', SplitTracker);
}

export default GaToSplit;