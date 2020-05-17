import { GOOGLE_ANALYTICS_TO_SPLIT, SPLIT_TO_GOOGLE_ANALYTICS } from '../../../utils/constants';
import validateIntegrationsSettings from './common';

const validateBrowserIntegrationsSettings = settings => {
  return validateIntegrationsSettings(settings, [GOOGLE_ANALYTICS_TO_SPLIT, SPLIT_TO_GOOGLE_ANALYTICS]);
};

export default validateBrowserIntegrationsSettings;
