import { isObject } from '../lang';
import logFactory from '../logger';
import { validateAttribute } from './attribute';
const log = logFactory('');

export function validateAttributes(maybeAttrs, method) {
  // Attributes are optional
  if (isObject(maybeAttrs) || maybeAttrs == undefined) // eslint-disable-line eqeqeq
    return maybeAttrs;

  log.error(`${method}: attributes must be a plain object.`);
  return false;
}

export function validateAttributesDeep(maybeAttributes, method) {
  if (!validateAttributes(maybeAttributes, method)) return false;
  
  let result = true;
  Object.keys(maybeAttributes).forEach(attributeKey => {
    if (!validateAttribute(attributeKey, maybeAttributes[attributeKey], method))
      result = false;
  });

  return result;

}
