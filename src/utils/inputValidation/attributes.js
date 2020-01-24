import { isObject } from '../lang';
import logFactory from '../logger';
const log = logFactory('');

export function validateAttributes(maybeAttrs, method) {
  // Attributes are optional
  if (isObject(maybeAttrs) || maybeAttrs == undefined) // eslint-disable-line eqeqeq
    return maybeAttrs;

  log.error(`${method}: attributes must be a plain object.`);
  return false;
}
