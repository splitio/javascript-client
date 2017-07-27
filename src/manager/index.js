// @flow

'use strict';

const thenable = require('../utils/promise/thenable');
const find = require('lodash/find');

const collectTreatments = (conditions): Array<string> => {
  // Rollout conditions are supposed to have the entire partitions list, so we find the first one.
  const firstRolloutCondition = find(conditions, (cond) => cond.conditionType === 'ROLLOUT');
  // Then extract the treatments from the partitions
  return firstRolloutCondition ? firstRolloutCondition.partitions.map(v => v.treatment) : [];
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
    treatments: collectTreatments(splitObject.conditions)
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
