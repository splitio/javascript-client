import 'isomorphic-unfetch';
import { SplitNetworkError } from '../../utils/lang/Errors';
import logFactory from '../../utils/logger';
const log = logFactory('splitio-services:service');

// @TODO update RequestFactory and remove this function
function fetchUrl(request) {
  const queryParams = request.params ? '?' + Object.keys(request.params).map(key => `${key}=${request.params[key]}`).join('&') : '';
  return request.url + queryParams;
}

export default function Fetcher(request) {
  // We use this fetch signature to support unfetch polyfill
  const url = fetchUrl(request);
  return fetch(url, request)
    // @TODO review: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#Checking_that_the_fetch_was_successful
    .then(response => {
      if (!response.ok) {
        throw { response };
      }
      return response;
    })
    .catch(error => {
      const resp = error.response;
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
