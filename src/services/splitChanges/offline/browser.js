function getConfigurationFromSettings(settings) {
  return settings.features || {};
}

export default getConfigurationFromSettings;