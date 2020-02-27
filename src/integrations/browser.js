import GaToSplit from './ga/GaToSplit';
import SplitToGa from './ga/SplitToGa';
import { GA_TO_SPLIT, SPLIT_TO_GA, SPLIT_IMPRESSION, SPLIT_EVENT } from '../utils/constants';

/**
 * Factory function for browser IntegrationsManager.
 * The integrations manager instantiates integration modules, and bypass tracked events and impressions to them.
 *
 * @param {Context} context SplitFactory context
 *
 * @returns integration manager or null if `integrations` are not present in settings.
 */
const integrationsManagerFactory = context => {
  const settings = context.get(context.constants.SETTINGS);

  const listeners = [];

  // No need to check if `settings.integrations` is an array. It was already validated in settings validation
  settings.integrations.forEach(integrationOptions => {
    const { type } = integrationOptions;
    let integration;

    switch (type) {
      case GA_TO_SPLIT: {
        const storage = context.get(context.constants.STORAGE);
        const coreSettings = settings.core;
        integration = GaToSplit(integrationOptions, storage, coreSettings);
        break;
      }

      case SPLIT_TO_GA: {
        integration = SplitToGa(integrationOptions);
        break;
      }
    }

    if (integration && integration.queue)
      listeners.push(integration);
  });

  // If `listeners` is empty, not return a integration manager
  if (listeners.length === 0)
    return;

  // Exception safe methods: each integration module is responsable for handling errors
  return {
    handleImpression: function (impressionData) {
      listeners.forEach(listener => listener.queue(impressionData, SPLIT_IMPRESSION));
    },
    handleEvent: function (eventData) {
      listeners.forEach(listener => listener.queue(eventData, SPLIT_EVENT));
    }
  };

};

export default integrationsManagerFactory;