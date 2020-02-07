import logFactory from '../../utils/logger';
import { uniq } from '../../utils/lang';
const log = logFactory('splitio: GA integration');

const defaultImpressionFilter = function () { return true; };

const defaultImpressionMapper = function (impressionData) {
  const fieldsObject = {
    hitType: 'event',
    eventCategory: 'split-impression',
    eventAction: impressionData.impression.feature,
    eventLabel: impressionData.impression.treatment,
  };
  return fieldsObject;
};

// A falsy object represents the default tracker
const defaultTrackerNames = [''];

function getGa() {
  return window[window['GoogleAnalyticsObject'] || 'ga'];
}

export default function (configObject) {

  // Check if `ga` object is available
  const ga = getGa();
  if (typeof ga !== 'function') {
    // @TODO review the following warning message
    log.warn('ga function not found. no hits will be sent');
    return null;
  }

  const configs = [];

  if (Array.isArray(configObject)) {
    configObject.forEach(configItem => {

      const impressionFilter = typeof (configItem.impressionFilter) === 'function' ?
        configItem.impressionFilter :
        defaultImpressionFilter;

      // @TODO Should we check something else about `configObject.impressionMapper`? 
      // It doesn't matter, because if the returned object is not a GA fieldsObject or string, ga send command will do nothing.
      const impressionMapper = typeof (configItem.impressionMapper) === 'function' ?
        configItem.impressionMapper :
        defaultImpressionMapper;

      const trackerNames = Array.isArray(configItem.trackerNames) ?
        // We strip off duplicated values if we received a trackerNames param. 
        // We don't warn if a tracker does not exist, since the user might create it after the SDK is initialized.
        // Note: GA allows to create and get trackers using a string or number as tracker name, and does nothing if other types are used
        uniq(configItem.trackerNames) :
        defaultTrackerNames;

      configs.push({
        impressionFilter,
        impressionMapper,
        trackerNames,
      });
    });
  } else {
    configs.push({
      impressionFilter: defaultImpressionFilter,
      impressionMapper: defaultImpressionMapper,
      trackerNames: defaultTrackerNames,
    });
  }

  return {
    logImpression: function (impressionData) {
      const ga = getGa();
      configs.forEach(config => {
        if (!config.impressionFilter(impressionData))
          return;

        const fieldsObject = config.impressionMapper(impressionData);

        config.trackerNames.forEach(trackerName => {
          const sendCommand = trackerName ? `${trackerName}.send` : 'send';
          ga(sendCommand, fieldsObject);
        });
      });
    }
  };
}
