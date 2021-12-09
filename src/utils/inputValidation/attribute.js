import { isString, numberIsFinite, isBoolean } from '../lang';
import logFactory from '../logger';
const log = logFactory('');

export function validateAttribute(attributeKey, attributeValue, method) {
  if (!isString(attributeKey) || attributeKey.length === 0){
    log.warn(`${method}: you passed an invalid attribute name, attribute name must be a non-empty string.`);
    return false;
  }

  const isStringVal = isString(attributeValue);
  const isFiniteVal = numberIsFinite(attributeValue);
  const isBoolVal = isBoolean(attributeValue);
  const isArrayVal = Array.isArray(attributeValue);

  if (!(isStringVal || isFiniteVal || isBoolVal || isArrayVal)) { // If it's not of valid type.
    log.warn(`${method}: you passed an invalid attribute value for ${attributeKey}. Acceptable types are: string, number, boolean and array of strings.`);
    return false;
  }

  return true;
}
