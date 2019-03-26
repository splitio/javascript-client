import thenable from '../utils/promise/thenable';
import { find } from '../utils/lang';
import { validateSplit, validateIfOperational } from '../utils/inputValidation';

const collectTreatments = (conditions) => {
  // Rollout conditions are supposed to have the entire partitions list, so we find the first one.
  const firstRolloutCondition = find(conditions, (cond) => cond.conditionType === 'ROLLOUT');
  // Then extract the treatments from the partitions
  return firstRolloutCondition ? firstRolloutCondition.partitions.map(v => v.treatment) : [];
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
    treatments: collectTreatments(splitObject.conditions),
    configurations: splitObject.configurations || {}
  };
};

const ObjectsToViews = (jsons) => {
  let views = [];

  for (let split of jsons) {
    const view = ObjectToView(split);
    if (view != null) views.push(view);
  }

  return views;
};

const SplitManagerFactory = (splits, context) => {
  const statusManager = context.get(context.constants.STATUS_MANAGER);

  return Object.assign(
    // Proto-linkage of the readiness Event Emitter
    Object.create(statusManager),
    {
      /**
       * Get the Split object corresponding to the given split name if valid
       */
      split(maybeSplitName) {
        const splitName = validateSplit(maybeSplitName, 'split');
        if (!validateIfOperational(context) || !splitName) {
          return null;
        }

        const split = splits.getSplit(splitName);

        if (thenable(split)) return split.then(result => ObjectToView(result));
        return ObjectToView(split);
      },
      /**
       * Get the Split objects present on the factory storage
       */
      splits() {
        if (!validateIfOperational(context)) {
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
        if (!validateIfOperational(context)) {
          return [];
        }
        return splits.getKeys();
      }
    }
  );
};

export default SplitManagerFactory;
