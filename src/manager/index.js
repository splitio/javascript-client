// @flow

'use strict';

/**
 * @note The backend sometimes doesn't answer the list of partitions correctly,
 *       so we need to build it mixing the list of partitions plus the default
 *       treatment.
 */
const fixMissingTreatment = (splitObject: SplitObject): Array<string> => {
  const treatments = splitObject.conditions[0].partitions.map(v => v.treatment);

  if (treatments.indexOf(splitObject.defaultTreatment) === -1) {
    treatments.push(splitObject.defaultTreatment);
  }

  return treatments;
};

const ObjectToView = (json: string): SplitView => {
  const splitObject: SplitObject = JSON.parse(json);

  return {
    name: splitObject.name,
    trafficType: splitObject.trafficTypeName,
    killed: splitObject.killed,
    changeNumber: splitObject.changeNumber,
    treatments: fixMissingTreatment(splitObject)
  };
};

const SplitManagerFactory = (splits: SplitCache): SplitManager => {

  return {
    async split(splitName: string): ?SplitView {
      const split = await splits.getSplit(splitName);

      if (split) {
        return ObjectToView(split);
      } else {
        return null;
      }
    },

    async splits(): Array<SplitView> {
      const els = [];
      const currentSplits = await splits.getAll();

      for (let split of currentSplits) {
        els.push(ObjectToView(split));
      }

      return els;
    },

    async names(): Array<string> {
      return splits.getKeys();
    }
  };

};

module.exports = SplitManagerFactory;
