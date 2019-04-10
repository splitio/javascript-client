import { isObject, forOwn } from '../../../utils/lang';
import parseCondition from './parseCondition';

function getConfigurationFromSettings(settings) {
  const mockSettings = settings.features || {};
  const splitObjects = {};

  forOwn(mockSettings, (data, splitName) => {
    let treatment = data;
    let config = null;

    if (isObject(data)) {
      treatment = data.treatment;
      config = data.config || config;
    }
    const configurations = {};
    if (config !== null) configurations[treatment] = config;

    splitObjects[splitName] = {
      conditions: [parseCondition({ treatment })],
      configurations
    };
  });

  return splitObjects;
}

export default getConfigurationFromSettings;
