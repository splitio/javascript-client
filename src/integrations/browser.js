import GaSplitTrackerManager from './ga/splitTracker';
import buildSplitToGaImpressionListener from './ga/splitToGa';
import { GA_TO_SPLIT, SPLIT_TO_GA } from '../utils/constants';
import { groupBy } from '../utils/lang';

const integrationsManagerFactory = context => {
  const settings = context.get(context.constants.SETTINGS);

  if (!settings.integrations)
    return;

  const groupedByIntegrations = groupBy(settings.integrations, 'type');
  const impressionListeners = [];
  const eventListeners = [];

  for (let name in groupedByIntegrations) {
    const options = groupedByIntegrations[name];
    console.log('grouped options: ' + name);
    console.dir(options);

    // GA-to-Split integration
    if (name === GA_TO_SPLIT) {
      const storage = context.get(context.constants.STORAGE);
      const gaSdkOptions = Object.assign(
        {
          eventHandler: function (event) {
            storage.events.track(event);
          },
          identities: [{ key: settings.core.key, trafficType: settings.core.trafficType }]
        },
        options[0]);
      // @TODO review next sentence. Should we store it somewhere?
      new GaSplitTrackerManager(gaSdkOptions);
      continue;
    }

    // Split-to-GA integration
    if (name === SPLIT_TO_GA) {
      const impressionListener = buildSplitToGaImpressionListener(options);
      impressionListeners.push(impressionListener);
      continue;
    }
  }

  // Each integration listener is responsable for handling errors
  if (impressionListeners.length > 0)
    return {
      handleImpression: function (impressionData) {
        impressionListeners.forEach(impressionListener => impressionListener.handleImpression(impressionData));
      },
      handleEvent: function(eventData) {
        eventListeners.forEach(eventListener => eventListener.handleEvent(eventData));
      }
    };

};

export default integrationsManagerFactory;
