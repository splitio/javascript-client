import GaToSplit from './ga/GaToSplit';
import SplitToGa from './ga/SplitToGa';
import { GA_TO_SPLIT, SPLIT_TO_GA } from '../utils/constants';

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

  // If no integrations settings, not return a integration manager
  if (!settings.integrations)
    return;

  const impressionListeners = [];
  const eventListeners = [];

  for (const integrationOptions of settings.integrations) {
    const { type } = integrationOptions;
    let integration;

    switch (type) {
      case GA_TO_SPLIT:
        var storage = context.get(context.constants.STORAGE);
        var coreSettings = settings.core;
        integration = GaToSplit(integrationOptions, storage, coreSettings);
        break;

      case SPLIT_TO_GA:
        integration = SplitToGa(integrationOptions);
    }

    if (integration) {
      if (integration.queueImpression) impressionListeners.push(integration);
      if (integration.queueEvent) eventListeners.push(integration);
    }
  }

  // Exception safe methods: each integration module is responsable for handling errors
  return {
    handleImpression: function (impressionData) {
      impressionListeners.forEach(impressionListener => impressionListener.queueImpression(impressionData));
    },
    handleEvent: function (eventData) {
      eventListeners.forEach(eventListener => eventListener.queueEvent(eventData));
    }
  };

};

export default integrationsManagerFactory;