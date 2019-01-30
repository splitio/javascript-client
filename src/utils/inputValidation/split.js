import { isString } from '../lang';
import logFactory from '../logger';
const log = logFactory('', {
  displayAllErrors: true
});
// include BOM and nbsp
const TRIMMABLE_SPACES_REGEX = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/;

export default function validateSplit(maybeSplit, method) {
  if (maybeSplit == undefined) { // eslint-disable-line eqeqeq
    log.error(`${method}: you passed a null or undefined split name, split name must be a non-empty string.`);
  } else if (!isString(maybeSplit)) {
    log.error(`${method}: you passed an invalid split name, split name must be a non-empty string.`);
  } else {
    if (TRIMMABLE_SPACES_REGEX.test(maybeSplit)) {
      log.warn(`${method}: split name "${maybeSplit}" has extra whitespace, trimming.`);
      maybeSplit = maybeSplit.trim();
    }

    if (maybeSplit.length > 0) {
      return maybeSplit;
    } else {
      log.error(`${method}: you passed an empty split name, split name must be a non-empty string.`);
    }
  }

  return false;
}
