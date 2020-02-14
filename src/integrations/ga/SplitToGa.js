import logFactory from '../../utils/logger';
import { uniq } from '../../utils/lang';
import { SPLIT_IMPRESSION, SPLIT_EVENT } from '../../utils/constants';
const log = logFactory('splitio-split-to-ga');

class SplitToGa {

  static defaultFilter() { return true; }

  static defaultMapper({ type, payload }) {
    switch (type) {
      case SPLIT_IMPRESSION:
        return {
          hitType: 'event',
          eventCategory: 'split-impression',
          eventAction: payload.impression.feature,
          eventLabel: payload.impression.treatment,
          nonInteraction: true,
        };
      case SPLIT_EVENT:
        return {
          hitType: 'event',
          eventCategory: 'split-event',
          eventAction: payload.eventTypeId,
          eventValue: payload.value,
          nonInteraction: true,
        };
    }
    return null;
  }

  static getGa() {
    return window[window['GoogleAnalyticsObject'] || 'ga'];
  }

  constructor(options) {

    // Check if `ga` object is available
    this.ga = SplitToGa.getGa();
    if (typeof this.ga !== 'function') {
      // @TODO review the following warning message
      log.warn('`ga` command queue not found. No hits will be sent.');
      // Return an empty object to avoid creating a SplitToGa instance 
      return {};
    }

    this.filter = typeof (options.filter) === 'function' ?
      options.filter :
      SplitToGa.defaultFilter;

    // @TODO Should we check something else about `configObject.impressionMapper`? 
    // It doesn't matter, because if the returned object is not a GA fieldsObject or string, ga send command will do nothing.
    this.mapper = typeof (options.mapper) === 'function' ?
      options.mapper :
      SplitToGa.defaultMapper;

    this.trackerNames = Array.isArray(options.trackerNames) ?
      // We strip off duplicated values if we received a `trackerNames` param. 
      // We don't warn if a tracker does not exist, since the user might create it after the SDK is initialized.
      // Note: GA allows to create and get trackers using a string or number as tracker name, and does nothing if other types are used.
      uniq(options.trackerNames) :
      SplitToGa.defaultTrackerNames;
  }

  queue(data) {
    try {
      const fieldsObject = this.filter(data) && this.mapper(data);
      if (!fieldsObject)
        return;

      // VALIDATE FIELDSOBJECT IN A PURE Function. CHECK BASIC STUFF: NO AN Array, KAY-VALUE generateKeyPairSync(,, options)

      this.trackerNames.forEach(trackerName => {
        const sendCommand = trackerName ? `${trackerName}.send` : 'send';
        this.ga(sendCommand, fieldsObject);
      });
    } catch (err) {
      log.warn(`SplitToGa queue method threw: ${err}. No hit was sent.`);
    }
  }

}

// A falsy object represents the default tracker
SplitToGa.defaultTrackerNames = [''];

export default SplitToGa;