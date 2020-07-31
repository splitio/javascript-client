import logFactory from '../../../utils/logger';
import { isString } from '../../../utils/lang';
const log = logFactory('splitio-settings');

/**
 * This function validates `settings.integrations` object
 *
 * @param {Object} settings SDK settings object to validate
 * @param {Array<string>} validIntegrationTypes list of integration types to filter from `settings.integrations`
 *
 * @returns {Array} array of valid integration items. The array might be empty if `settings` object does not have valid integrations.
 */
const validateIntegrationsSettings = (settings, validIntegrationTypes = []) => {
  const { integrations } = settings;

  // If integrations is not an array or an empty array, we return an empty array (no integrations).
  if (!Array.isArray(integrations) || integrations.length === 0)
    return [];

  // We remove invalid integration items
  const validIntegrations = integrations.filter(integration => {
    return integration && isString(integration.type) && validIntegrationTypes.indexOf(integration.type) > -1;
  });

  const invalids = integrations.length - validIntegrations.length;
  if (invalids)
    log.warn(`${invalids} integration ${invalids === 1 ? 'item' : 'items'} at settings ${invalids === 1 ? 'is' : 'are'} invalid: integration items must have a valid 'type' value`);

  return validIntegrations;
};

export default validateIntegrationsSettings;