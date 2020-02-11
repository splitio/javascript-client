import logFactory from '../../../utils/logger';
const log = logFactory('splitio-settings');

const validateIntegrationsSettings = (settings, validIntegrationTypes = []) => {
  const { integrations } = settings;

  // If integrations is not an array or an empty array, we return undefined (no integrations).
  if (!Array.isArray(integrations) || integrations.length === 0)
    return undefined;

  // We remove invalid integration items
  const validIntegrations = integrations.filter(integration => {
    return integration && validIntegrationTypes.includes(integration.type);
  });

  // @TODO review the following message. We can provide a messege per each invalid integration item, instead of a general one.
  const invalids = integrations.length - validIntegrations.length;
  if (invalids)
    log.warn(`${invalids} integration ${invalids === 1 ? 'item' : 'items'} at settings ${invalids === 1 ? 'is' : 'are'} invalid: integration items must have a valid 'type' value`);

  // Return validIntegrations or undefined if empty
  return validIntegrations.length > 0 ? validIntegrations : undefined;
};

export default validateIntegrationsSettings;