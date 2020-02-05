import logFactory from '../../utils/logger';
const log = logFactory('splitio: GA integration');

const defaultImpressionFilter = function() { return true; };

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

export default function (configObject) {

  // Check if `ga` object is available
  const ga = window[window['GoogleAnalyticsObject'] || 'ga'];
  if (typeof ga !== 'function') {
    // @TODO review the following warning message
    log.warn('ga function not found. no hits will be sent');
    return null;
  }

  const impressionFilter = typeof (configObject.impressionFilter) === 'function' ?
    configObject.impressionFilter : 
    defaultImpressionFilter;

  // @TODO Should we check something else about `configObject.impressionMapper`? 
  // It doesn't matter, because if the returned object is not a GA fieldsObject or string, ga send command will do nothing.
  const impressionMapper = typeof (configObject.impressionMapper) === 'function' ?
    configObject.impressionMapper : 
    defaultImpressionMapper;

  // @TODO Should we check something else about `configObject.trackerNames`?
  // Currently, a falsy object represents the default tracker. So, if the array contains N falsy objects, the `ga('send', fieldsObject)` will be called N times. 
  // Should we warn if a tracker does not exist? Something like: "tracker XXX is not available.". However the user might create it after SDK is initialized.
  const trackerNames = Array.isArray(configObject.trackerNames) ?
    configObject.trackerNames :
    defaultTrackerNames;

  return {
    logImpression: function (impressionData) {
      if(!impressionFilter(impressionData))
        return;

      const fieldsObject = impressionMapper(impressionData);

      trackerNames.forEach(trackerName => {
        if (trackerName)
          ga(`${trackerName}.send`, fieldsObject);
        else
          ga('send', fieldsObject);
      });
    }
  };
}
