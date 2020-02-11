import { GA_TO_SPLIT, SPLIT_TO_GA } from '../../../utils/constants';
import validateIntegrationsSettings from './common';

const validateBrowserIntegrationsSettings = settings => {
  return validateIntegrationsSettings(settings, [GA_TO_SPLIT, SPLIT_TO_GA]);
};

export default validateBrowserIntegrationsSettings;
