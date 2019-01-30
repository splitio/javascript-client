import { isFinite } from '../lang';
import logFactory from '../logger';
const log = logFactory('', {
  displayAllErrors: true
});

export default function validateEventValue(maybeValue, method) {
  if (isFinite(maybeValue)) return maybeValue;

  log.error(`${method}: value must be a finite number.`);
  return false;
}
