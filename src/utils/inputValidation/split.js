import { isString } from '../lang';
import { SPLIT_NOT_FOUND } from '../labels';
import logFactory from '../logger';
const log = logFactory('');
// include BOM and nbsp
const TRIMMABLE_SPACES_REGEX = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/;

export function validateSplit(maybeSplit, method, item = 'split name') {
  if (maybeSplit == undefined) { // eslint-disable-line eqeqeq
    log.error(`${method}: you passed a null or undefined ${item}, ${item} must be a non-empty string.`);
  } else if (!isString(maybeSplit)) {
    log.error(`${method}: you passed an invalid ${item}, ${item} must be a non-empty string.`);
  } else {
    if (TRIMMABLE_SPACES_REGEX.test(maybeSplit)) {
      log.warn(`${method}: ${item} "${maybeSplit}" has extra whitespace, trimming.`);
      maybeSplit = maybeSplit.trim();
    }

    if (maybeSplit.length > 0) {
      return maybeSplit;
    } else {
      log.error(`${method}: you passed an empty ${item}, ${item} must be a non-empty string.`);
    }
  }

  return false;
}

/**
 * This is defined here and in this format mostly because of the logger and the fact that it's considered a validation at product level.
 * But it's not going to run on the input validation layer. In any case, the most compeling reason to use it as we do is to avoid going to Redis and get a split twice.
 */
export function validateSplitExistance(context, splitName, labelOrSplitObj, method) {
  if (context.get(context.constants.READY, true)) { // Only if it's ready we validate this, otherwise it may just be that the SDK is not ready yet.
    if (labelOrSplitObj === SPLIT_NOT_FOUND || labelOrSplitObj == null) {
      log.warn(`${method}: you passed "${splitName}" that does not exist in this environment, please double check what Splits exist in the web console.`);
      return false;
    }
  }

  return true;
}
