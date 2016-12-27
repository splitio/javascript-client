// @flow

'use strict';

/**
 * @note The backend sometimes doesn't answer the list of partitions correctly,
 *       so we need to build it mixing the list of partitions plus the default
 *       treatment.
 */
const fixMissingTreatment = (splitObject : SplitObject) : Array<string> => {
  const treatments = splitObject.conditions[0].partitions.map(v => v.treatment);

  if (treatments.indexOf(splitObject.defaultTreatment) === -1) {
    treatments.push(splitObject.defaultTreatment);
  }

  return treatments;
};

const SplitManagerFactory = (splitCache : SplitCache) => {

  return {

    splits() : Array<FormattedSplit> {
      const els = [];

      for (let split of splitCache.getAll()) {
        const splitObject : SplitObject = JSON.parse(split);

        els.push({
          name : splitObject.name,
          trafficType : splitObject.trafficTypeName,
          killed : splitObject.killed,
          changeNumber : splitObject.changeNumber,
          treatments : fixMissingTreatment(splitObject)
        });
      }

      return els;
    }

  };

};

module.exports = SplitManagerFactory;
