import { providePlugin, SplitTracker, sdkOptions } from './ga/splitTracker';
import { isObject } from '../utils/lang';
import logFactory from '../utils/logger';
const log = logFactory('splitio');

const browserSetupIntegrations = (context) => {
  const settings = context.get(context.constants.SETTINGS);
  const storage = context.get(context.constants.STORAGE);

  if (settings.integrations) {
    if (settings.integrations.ga2split) {
      sdkOptions.eventHandler = function (event) {
        storage.events.track(event);
      };
      if (settings.core.trafficType)
        sdkOptions.identities = [{ key: settings.core.key, trafficType: settings.core.trafficType }];

      if (isObject(settings.integrations.ga2split))
        Object.assign(sdkOptions, settings.integrations.ga2split);

      // @TODO review error condition and message
      if (!sdkOptions.identities || sdkOptions.identities.length === 0) {
        log.error('A traffic type is required for tracking GA hits as Split events');
      }
      // Register the plugin, even if config is invalid, since, if not provided, it will block `ga` command queue.
      providePlugin('splitTracker', SplitTracker);
    }
  }
};

export default browserSetupIntegrations;
