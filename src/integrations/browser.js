import GaSplitTrackerManager from './ga/splitTracker';
import { isObject } from '../utils/lang';

const browserSetupIntegrations = (context) => {
  const settings = context.get(context.constants.SETTINGS);

  if (settings.integrations) {
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
  }
};

export default browserSetupIntegrations;
