import { isFinite } from '../lang';
import logFactory from '../logger';
const log = logFactory('', {
  displayAllErrors: true
});

export function validateEventValue(maybeValue, method) {
  if (isFinite(maybeValue) || maybeValue == undefined) // eslint-disable-line eqeqeq
    return maybeValue;

  log.error(`${method}: value must be a finite number.`);
  return false;
}
