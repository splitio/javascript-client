import objectAssign from 'object-assign';
import thenable from '../utils/promise/thenable';
import { find } from '../utils/lang';
import { validateSplit, validateSplitExistance, validateIfDestroyed, validateIfReady } from '../utils/inputValidation';

const collectTreatments = (splitObject) => {
  const conditions = splitObject.conditions;
  // Rollout conditions are supposed to have the entire partitions list, so we find the first one.
  let allTreatmentsCondition = find(conditions, (cond) => cond.conditionType === 'ROLLOUT');
  // Localstorage mode could fall into a no rollout conditions state. Take the first condition in that case.
  if (!allTreatmentsCondition) allTreatmentsCondition = conditions[0];
  // Then extract the treatments from the partitions
  return allTreatmentsCondition ? allTreatmentsCondition.partitions.map(v => v.treatment) : [];
};

const ObjectToView = (json) => {
  let splitObject;

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
    treatments: collectTreatments(splitObject),
    configs: splitObject.configurations || {}
  };
};

const ObjectsToViews = (jsons) => {
  let views = [];

  jsons.forEach(split => {
    const view = ObjectToView(split);
    if (view != null) views.push(view);
  });

  return views;
};

function SplitManagerFactory(splits, context) {
  const SPLIT_FN_LABEL = 'split';
  const statusManager = context.get(context.constants.STATUS_MANAGER);

  return objectAssign(
    // Proto-linkage of the readiness Event Emitter
    Object.create(statusManager),
    {
      /**
       * Get the Split object corresponding to the given split name if valid
       */
      split(maybeSplitName) {
        const splitName = validateSplit(maybeSplitName, SPLIT_FN_LABEL);
        if (!validateIfDestroyed(context) || !validateIfReady(context, SPLIT_FN_LABEL) || !splitName) {
          return null;
        }

        const split = splits.getSplit(splitName);

        if (thenable(split)) {
          return split.then(result => {
            validateSplitExistance(context, splitName, result, SPLIT_FN_LABEL);
            return ObjectToView(result);
          });
        }

        validateSplitExistance(context, splitName, split, SPLIT_FN_LABEL);

        return ObjectToView(split);
      },
      /**
       * Get the Split objects present on the factory storage
       */
      splits() {
        if (!validateIfDestroyed(context) || !validateIfReady(context, 'splits')) {
          return [];
        }
        const currentSplits = splits.getAll();

        if (thenable(currentSplits)) return currentSplits.then(ObjectsToViews);
        return ObjectsToViews(currentSplits);
      },
      /**
       * Get the Split names present on the factory storage
       */
      names() {
        if (!validateIfDestroyed(context) || !validateIfReady(context, 'names')) {
          return [];
        }
        return splits.getKeys();
      }
    }
  );
}

export default SplitManagerFactory;
