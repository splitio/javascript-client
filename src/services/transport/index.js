// import axios from 'axios';
import { SplitNetworkError } from '../../utils/lang/Errors';
import logFactory from '../../utils/logger';
const log = logFactory('splitio-services:service');

export default function Fetcher(request) {
  let result;
  // TODO: This will log credentials, we should strip out Authorization header
  log['debug'](`Fetcher making request: ${JSON.stringify(request)}`)
  // TODO: This is a pretty lazy map from an axio request to fetch API
  // we should do this properly and actually test it.
  return fetch(request.url, request)
    .then(res => {
      log['debug'](`Got response: ${JSON.stringify(res)}`)
      result = res
      return res.json()
    })
    .then(json => {
      log['debug'](`Got response body: ${JSON.stringify(json)}`);
      return {
        status: result.status,
        statusText: result.statusText,
        data: json,
        headers: result.headers,
        // TODO: Do we need these keys in the response? Axios would have provided them
        // config
        // request
      }
    })
    .catch(error => {
      // TODO: When using the fetch API, an error will only be thrown if there are network
      // problems, we should move this 400x error handling up into the response handler
      const resp = error.response;
      const url = error.config ? error.config.url : 'unknown';
      let msg = '';

      if (resp) { // An HTTP error
        switch (resp.status) {
          case 404: msg = 'Invalid API key or resource not found.';
            break;
          default: msg = resp.statusText;
            break;
        }
      } else { // Something else, either an error making the request or a Network error.
        msg = error.message;
      }

      if (!resp || resp.status !== 403) { // 403's log we'll be handled somewhere else.
        log[request.logErrorsAsInfo ? 'info' : 'error'](`Response status is not OK. Status: ${resp ? resp.status : 'NO_STATUS'}. URL: ${url}. Message: ${msg}`);
      }

      throw new SplitNetworkError(msg, resp ? resp.status : 'NO_STATUS');
    });
}

// This function is only exposed for unit testing purposses.
export function __getAxiosInstance() {
  return;
}
