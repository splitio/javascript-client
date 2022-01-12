import { isObject, forOwn } from '../../../utils/lang';
import parseCondition from './parseCondition';

function hasTreatmentChanged(prev, curr) {
  if (typeof prev !== typeof curr) return true;

  if (typeof prev === 'string') { // strings treatments, just compare
    return prev !== curr;
  } else { // has treatment and config, compare both
    return prev.treatment !== curr.treatment || prev.config !== curr.config;
  }
}

export default function createGetConfigurationFromSettings() {

  let previousMock = { 'emptyMock': 1 };

  function mockUpdated(currentData) {
    const names = Object.keys(currentData);

    // Different amount of items
    if (names.length !== Object.keys(previousMock).length) {
      previousMock = currentData;
      return true;
    }

    return names.some(name => {
      const newSplit = !previousMock[name];
      const newTreatment = hasTreatmentChanged(previousMock[name], currentData[name]);
      const changed = newSplit || newTreatment;

      if (changed) previousMock = currentData;

      return changed;
    });
  }

  return function getConfigurationFromSettings(settings) {
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
        trafficTypeName: 'localhost',
        conditions: [parseCondition({ treatment })],
        configurations
      };
    });

    return splitObjects;
  };

}
