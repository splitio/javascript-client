import { isObject, shallowClone, isString, numberIsFinite, isBoolean } from '../lang';
import logFactory from '../logger';
const log = logFactory('');

const ECMA_SIZES = {
  NULL: 0,       // While on the JSON it's going to occupy more space, we'll take it as 0 for the approximation.
  STRING: 2,
  BOOLEAN: 4,
  NUMBER: 8
};
const MAX_PROPERTIES_AMOUNT = 300;
const MAX_PROPERTIES_SIZE = 1024 * 32;
const BASE_EVENT_SIZE = 1024; // We assume 1kb events without properties (avg measured)

export function validateEventProperties(maybeProperties, method) {
  if (maybeProperties == undefined) return { properties: null, size: BASE_EVENT_SIZE }; // eslint-disable-line eqeqeq

  if (!isObject(maybeProperties)) {
    log.error(`${method}: properties must be a plain object.`);
    return { properties: false, size: BASE_EVENT_SIZE };
  }

  const keys = Object.keys(maybeProperties);
  const clone = shallowClone(maybeProperties);
  // To avoid calculating the size twice we'll return it from here.
  const output = {
    properties: clone,
    size: BASE_EVENT_SIZE            // We assume 1kb events without properties (avg measured)
  };

  if (keys.length > MAX_PROPERTIES_AMOUNT) {
    log.warn(`${method}: Event has more than 300 properties. Some of them will be trimmed when processed.`);
  }

  for (let i = 0; i < keys.length; i++) {
    output.size += keys[i].length * ECMA_SIZES.STRING; // Count the size of the key which is always a string.

    let val = clone[keys[i]];

    const isStringVal = isString(val);
    const isFiniteVal = numberIsFinite(val);
    const isBoolVal = isBoolean(val);
    let isNullVal = val === null;

    if (!(isStringVal || isFiniteVal || isBoolVal || isNullVal)) { // If it's not of valid type.
      clone[keys[i]] = null;
      val = null;
      isNullVal = true;
      log.warn(`${method}: Property ${keys[i]} is of invalid type. Setting value to null.`);
    }

    if (isNullVal) output.size += ECMA_SIZES.NULL;
    else if (isFiniteVal) output.size += ECMA_SIZES.NUMBER;
    else if (isBoolVal) output.size += ECMA_SIZES.BOOLEAN;
    else if (isStringVal) output.size += val.length * ECMA_SIZES.STRING;

    if (output.size > MAX_PROPERTIES_SIZE) {
      log.error(`${method}: The maximum size allowed for the properties is 32768 bytes, which was exceeded. Event not queued.`);
      output.properties = false;
      break;
    }
  }

  return output;
}
