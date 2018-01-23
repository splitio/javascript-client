'use strict';

function getConfigurationFromSettings(settings) {
  return settings.features || {};
}

module.exports = getConfigurationFromSettings;
