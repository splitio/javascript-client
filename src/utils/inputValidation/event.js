import { isString } from '../lang';
import logFactory from '../logger';
const log = logFactory('');

const EVENT_TYPE_REGEX = /^[a-zA-Z0-9][-_.:a-zA-Z0-9]{0,79}$/;

export function validateEvent(maybeEvent, method) {
  if (maybeEvent == undefined) { // eslint-disable-line eqeqeq
    log.error(`${method}: you passed a null or undefined event_type, event_type must be a non-empty string.`);
  } else if (!isString(maybeEvent)) {
    log.error(`${method}: you passed an invalid event_type, event_type must be a non-empty string.`);
  } else { // It is a string.
    if (maybeEvent.length === 0) {
      log.error(`${method}: you passed an empty event_type, event_type must be a non-empty string.`);
    } else if (!EVENT_TYPE_REGEX.test(maybeEvent)) {
      log.error(`${method}: you passed "${maybeEvent}", event_type must adhere to the regular expression /^[a-zA-Z0-9][-_.:a-zA-Z0-9]{0,79}$/g. This means an event_type must be alphanumeric, cannot be more than 80 characters long, and can only include a dash, underscore, period, or colon as separators of alphanumeric characters.`);
    } else {
      return maybeEvent;
    }
  }

  return false;
}
