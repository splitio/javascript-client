import { isString } from '../lang';
import logFactory from '../logger';
const log = logFactory('', {
  displayAllErrors: true
});

export function validateApiKey(maybeApiKey) {
  if (maybeApiKey == undefined) { // eslint-disable-line eqeqeq
    log.error('Factory instantiation: you passed a null or undefined api_key, api_key must be a non-empty string.');
  } else if (isString(maybeApiKey)) {
    if (maybeApiKey.length > 0) return maybeApiKey;

    log.error('Factory instantiation: you passed an empty api_key, api_key must be a non-empty string.');
  } else {
    log.error('Factory instantiation: you passed an invalid api_key, api_key must be a non-empty string.');
  }

  return false;
}
