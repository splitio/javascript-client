import { GOOGLE_ANALYTICS_TO_SPLIT, SPLIT_TO_GOOGLE_ANALYTICS } from '@splitsoftware/splitio-commons/src/utils/constants/browser';
import { validateConfigurableIntegrations } from '@splitsoftware/splitio-commons/src/utils/settingsValidation/integrations/configurable';

export function validateIntegrations(settings) {
  return validateConfigurableIntegrations(settings, [GOOGLE_ANALYTICS_TO_SPLIT, SPLIT_TO_GOOGLE_ANALYTICS]);
}
