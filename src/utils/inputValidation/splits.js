import { uniq } from '../lang';
import logFactory from '../logger';
import { validateSplit } from './split';
const log = logFactory('', {
  displayAllErrors: true
});

export function validateSplits(maybeSplits, method) {
  if (Array.isArray(maybeSplits) && maybeSplits.length > 0) {
    let validatedArray = [];
    // Remove invalid values
    maybeSplits.forEach(maybeSplit => {
      const splitName = validateSplit(maybeSplit);
      if (splitName) validatedArray.push(splitName);
    });

    // Strip off duplicated values if we have valid split names then return
    if (validatedArray.length) return uniq(validatedArray);
  }

  log.error(`${method}: split_names must be a non-empty array.`);
  return false;
}
