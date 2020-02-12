import logFactory from '../../utils/logger';
import { uniq } from '../../utils/lang';
import { SPLIT_IMPRESSION, SPLIT_EVENT } from '../../utils/constants';
const log = logFactory('splitio-integrations:split-to-ga');

const defaultFilter = function () { return true; };

const defaultMapper = function (data, type) {
  switch (type) {
    case SPLIT_IMPRESSION:
      return {
        hitType: 'event',
        eventCategory: 'split-impression',
        eventAction: data.impression.feature,
        eventLabel: data.impression.treatment,
        nonInteraction: true,
      };
    case SPLIT_EVENT:
      return {
        hitType: 'event',
        eventCategory: 'split-event',
        eventAction: data.eventTypeId,
        eventValue: data.value,
        nonInteraction: true,
      };
  }
  return null;
};

// A falsy object represents the default tracker
const defaultTrackerNames = [''];

function getGa() {
  return window[window['GoogleAnalyticsObject'] || 'ga'];
}

function SplitToGaFactory(options) {

  // Check if `ga` object is available
  const ga = getGa();
  if (typeof ga !== 'function') {
    // @TODO review the following warning message
    log.warn('`ga` command queue not found. No hits will be sent.');
    return null;
  }

  const filter = typeof (options.filter) === 'function' ?
    options.filter :
    defaultFilter;

  // @TODO Should we check something else about `configObject.impressionMapper`? 
  // It doesn't matter, because if the returned object is not a GA fieldsObject or string, ga send command will do nothing.
  const mapper = typeof (options.mapper) === 'function' ?
    options.mapper :
    defaultMapper;

  const trackerNames = Array.isArray(options.trackerNames) ?
    // We strip off duplicated values if we received a `trackerNames` param. 
    // We don't warn if a tracker does not exist, since the user might create it after the SDK is initialized.
    // Note: GA allows to create and get trackers using a string or number as tracker name, and does nothing if other types are used.
    uniq(options.trackerNames) :
    defaultTrackerNames;

  return {
    queue: function (data, type) {
      try {
        const fieldsObject = filter(data, type) && mapper(data, type);
        if (!fieldsObject)
          return;

        trackerNames.forEach(trackerName => {
          const sendCommand = trackerName ? `${trackerName}.send` : 'send';
          ga(sendCommand, fieldsObject);
        });
      } catch (err) {
        log.warn(`SplitToGa queue method threw: ${err}. No hit was sent.`);
      }
    }
  };
}

export default SplitToGaFactory;