'use strict';

function getConfigurationFromSettings(settings: Settings): Object {
  return settings.features;
}

module.exports = getConfigurationFromSettings;
