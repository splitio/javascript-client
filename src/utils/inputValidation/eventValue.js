import { numberIsFinite } from '../lang';
import logFactory from '../logger';
const log = logFactory('');

export function validateEventValue(maybeValue, method) {
  if (numberIsFinite(maybeValue) || maybeValue == undefined) // eslint-disable-line eqeqeq
    return maybeValue;

  log.error(`${method}: value must be a finite number.`);
  return false;
}
