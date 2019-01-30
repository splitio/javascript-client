import { isObject } from '../lang';
import logFactory from '../logger';
const log = logFactory('', {
  displayAllErrors: true
});

export default function validateAttributes(maybeAttrs, method) {
  if (isObject(maybeAttrs)) return maybeAttrs;

  log.error(`${method}: attributes must be a plain object.`);
  return false;
}
