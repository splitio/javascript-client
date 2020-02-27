import logFactory from '../utils/logger';
const log = logFactory('splitio-client');
import { evaluateFeatures } from '../engine/evaluator';
import thenable from '../utils/promise/thenable';
import { matching } from '../utils/key/factory';
import { SDK_NOT_READY } from '../utils/labels';
import { CONTROL } from '../utils/constants';

function ClientFactory(context) {

  // Note the storage parameter added
  function getTreatments(key, splitNames, attributes, storage, withConfig = false) {
    const results = {};

    const wrapUp = (evaluationResults) => {
      Object.keys(evaluationResults).forEach(splitName => {
        results[splitName] = processEvaluation(evaluationResults[splitName], splitName, key, withConfig);
      });
      return results;
    };

    const evaluations = evaluateFeatures(key, splitNames, attributes, storage);

    return (thenable(evaluations)) ? evaluations.then((res) => wrapUp(res)) : wrapUp(evaluations);
  }

  // Note the storage parameter added
  function getTreatmentsWithConfig(key, splitNames, storage, attributes) {
    return getTreatments(key, splitNames, attributes, storage, true);
  }

  // Internal function
  function processEvaluation(
    evaluation,
    splitName,
    key,
    withConfig
  ) {
    const isSdkReady = context.get(context.constants.READY, true) || context.get(context.constants.READY_FROM_CACHE, true);
    const matchingKey = matching(key);

    // If the SDK was not ready, treatment may be incorrect due to having Splits but not segments data.
    if (!isSdkReady) {
      evaluation = { treatment: CONTROL, label: SDK_NOT_READY };
    }

    const { treatment, label, config = null } = evaluation;
    log.info(`Split: ${splitName}. Key: ${matchingKey}. Evaluation: ${treatment}. Label: ${label}`);

    if (withConfig) {
      return {
        treatment,
        config
      };
    }

    return treatment;
  }

  return {
    getTreatments, getTreatmentsWithConfig
  };
}

export default ClientFactory;
