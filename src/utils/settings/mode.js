import { LOCALHOST_MODE, STANDALONE_MODE, PRODUCER_MODE, CONSUMER_MODE } from '../constants';

function mode(key, mode) {
  // Leaving the comparison as is, in case we change the mode name but not the setting.
  if (key === 'localhost') return LOCALHOST_MODE;

  if ([STANDALONE_MODE, PRODUCER_MODE, CONSUMER_MODE].indexOf(mode) === -1) throw Error('Invalid mode provided');

  return mode;
}

export default mode;