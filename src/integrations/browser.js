import GaSplitTrackerManager from './ga/splitTracker';
import buildSplitToGaImpressionListener from './ga/splitToGa';
import { isObject } from '../utils/lang';

const browserSetupIntegrations = (context) => {
  const settings = context.get(context.constants.SETTINGS);

  if (settings.integrations) {

    // GA-to-Split integration
    if (settings.integrations.ga2split) {

      const storage = context.get(context.constants.STORAGE);
      const ga2split = settings.integrations.ga2split;

      const gaSdkOptions = Object.assign(
        {
          eventHandler: function (event) {
            storage.events.track(event);
          },
          identities: [{ key: settings.core.key, trafficType: settings.core.trafficType }]
        },
        isObject(ga2split) ? ga2split : {});
      new GaSplitTrackerManager(gaSdkOptions);
    }

    // Split-to-GA integration
    if (settings.integrations.split2ga) {
      context.put(context.constants.INTERNAL_IMPRESSION_LISTENER,
        buildSplitToGaImpressionListener(settings.integrations.split2ga));
    }
  }
};

export default browserSetupIntegrations;
