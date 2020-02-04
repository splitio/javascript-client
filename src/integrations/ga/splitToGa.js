import logFactory from '../../utils/logger';
const log = logFactory('splitio: GA integration');

const buildImpressionMapper = function (labelDimensionIndex, nonInteraction) {
  return function (impressionData) {
    const fieldsObject = {
      hitType: 'event',
      eventCategory: 'split-impression',
      eventAction: impressionData.feature,
      eventLabel: impressionData.treatment,
    };
    if (labelDimensionIndex) {
      fieldsObject['dimension' + labelDimensionIndex] = impressionData.impression.label;
    }
    if (nonInteraction) {
      fieldsObject['nonInteraction'] = nonInteraction;
    }
    return fieldsObject;
  };
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

  // @TODO Should we check something else ? 
  // It doesn't matter, because if the returned object is not a GA fieldsObject or string, ga send command will do nothing.
  const impressionMapper = typeof (configObject.impressionMapper) === 'function' ?
    configObject.impressionMapper :
    buildImpressionMapper(configObject.labelDimensionIndex);

  // @TODO Should we check something else ?
  // Currently, a falsy object represents the default tracker. So, if the array contains N falsy objects, the `ga('send', fieldsObject)` will be called N times. 
  const trackerNames = Array.isArray(configObject.trackerNames) ?
    configObject.trackerNames :
    defaultTrackerNames;

  return {
    logImpression: function (impressionData) {
      const fieldsObject = impressionMapper(impressionData);

      trackerNames.forEach(trackerName => {
        if(trackerName)
          ga(`${trackerName}.send`, fieldsObject);
        else
          ga('send', fieldsObject);
      });
    }
  };
}
