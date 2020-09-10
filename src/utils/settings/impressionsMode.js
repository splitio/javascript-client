import { DEBUG, OPTIMIZED, NONE } from '../constants';
import logFactory from '../logger';
const log = logFactory('splitio-settings');

function validImpressionsMode(impressionsMode) {
  if ([DEBUG, OPTIMIZED, NONE].indexOf(impressionsMode) === -1) {
    log.error('You passed an invalid impressionsMode, impressionsMode should be one of the following values: OPTIMIZED or DEBUG. The sdk continues in OPTIMIZED mode.');
    impressionsMode = OPTIMIZED;
  }

  return impressionsMode;
}

export default validImpressionsMode;