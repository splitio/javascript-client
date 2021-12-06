import { isString, numberIsFinite, isBoolean } from '../lang';
import logFactory from '../logger';
const log = logFactory('');

export function validateAttribute(attributeKey, attributeValue, method) {
  if (!isString(attributeKey) || attributeKey.length === 0 || attributeKey === 'null'){
    log.warn(`${method}: you passed an invalid attribute name, attribute name must be a non-empty string.`);
    return false;
  }

  const isStringVal = isString(attributeValue);
  const isFiniteVal = numberIsFinite(attributeValue);
  const isBoolVal = isBoolean(attributeValue);
  const isArrayVal = Array.isArray(attributeValue);
  const isNullVal = attributeValue === null;

  if (!(isStringVal || isFiniteVal || isBoolVal || isArrayVal || isNullVal)) { // If it's not of valid type.
    log.warn(`${method}: you passed an invalid attribute value for ${attributeKey}, acceptable types are String, Number, Boolean and Lists.`);
    return false;
  }

  return true;
}
