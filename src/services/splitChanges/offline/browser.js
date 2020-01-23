import { isObject, forOwn } from '../../../utils/lang';
import parseCondition from './parseCondition';

let previousMock = { '':1 };

function mockUpdated(currentData) {
  const names = Object.keys(currentData);

  // Different amount of items
  if (names.length !== Object.keys(previousMock).length) {
    previousMock = currentData;
    return true;
  }

  return names.some(name => {
    const newSplit = !previousMock[name];
    const newTreatment = previousMock[name] !== currentData[name];

    previousMock = currentData;
    
    return newSplit || newTreatment;
  });
}

function getConfigurationFromSettings(settings) {
  const mockSettings = settings.features || {};

  if (!mockUpdated(mockSettings)) return false;

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
