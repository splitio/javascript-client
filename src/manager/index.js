// @flow

'use strict';

const thenable = require('../utils/promise/thenable');

/**
 * @NOTE The backend sometimes doesn't answer the list of partitions correctly,
 *       so we need to build it mixing the list of partitions plus the default
 *       treatment.
 */
const fixMissingTreatment = (firstCondition, defaultTreatment): Array<string> => {
  const treatments = firstCondition ? firstCondition.partitions.map(v => v.treatment) : [];

  if (treatments.indexOf(defaultTreatment) === -1) {
    treatments.push(defaultTreatment);
  }

  return treatments;
};

const ObjectToView = (json: string): ?SplitView => {
  let splitObject: SplitObject;

  try {
    splitObject = JSON.parse(json);
  } catch(e) {
    return null;
  }

  if (splitObject == null) return null;

  return {
    name: splitObject.name,
    trafficType: splitObject.trafficTypeName || null,
    killed: splitObject.killed,
    changeNumber: splitObject.changeNumber || 0,
    treatments: fixMissingTreatment(splitObject.conditions[0], splitObject.defaultTreatment)
  };
};

const ObjectsToViews = (jsons: Array<string>): Array<SplitView> => {
  let views = [];

  for (let split of jsons) {
    const view = ObjectToView(split);
    if (view != null) views.push(view);
  }

  return views;
};

const SplitManagerFactory = (splits: SplitCache): SplitManager => {

  return {
    split(splitName: string): ?SplitView {
      const split = splits.getSplit(splitName);

      if (thenable(split)) return split.then(result => ObjectToView(result));
      return ObjectToView(split);
    },

    splits(): Array<SplitView> {
      const currentSplits = splits.getAll();

      if (thenable(currentSplits)) return currentSplits.then(ObjectsToViews);
      return ObjectsToViews(currentSplits);
    },

    names(): Array<string> {
      return splits.getKeys();
    }
  };

};

module.exports = SplitManagerFactory;
