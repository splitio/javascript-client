import { DEBUG, OPTIMIZED } from '../constants';
import logFactory from '../logger';
const log = logFactory('splitio-settings');

function validImpressionsMode(impressionsMode) {
  impressionsMode = impressionsMode.toUpperCase();
  if ([DEBUG, OPTIMIZED].indexOf(impressionsMode) === -1) {
    log.error(`You passed an invalid impressionsMode, impressionsMode should be one of the following values: '${DEBUG}' or '${OPTIMIZED}'. Defaulting to '${OPTIMIZED}' mode.`);
    impressionsMode = OPTIMIZED;
  }

  return impressionsMode;
}

export default validImpressionsMode;
