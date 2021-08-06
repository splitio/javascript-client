import getFetch from '../getFetch';
import { SplitNetworkError } from '../../utils/lang/Errors';
import logFactory from '../../utils/logger';
const log = logFactory('splitio-services:service');

const messageNoFetch = 'Global fetch API is not available.';

export default function Fetcher(request) {
  // using `fetch(url, options)` signature to work with unfetch
  const url = request.url;
  const fetch = getFetch();

  return fetch ? fetch(url, request)
    // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#Checking_that_the_fetch_was_successful
    .then(response => {
      if (!response.ok) {
        return response.text().then(message => Promise.reject({ response, message }));
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
          // Don't use resp.statusText since reason phrase is removed in HTTP/2
          default: msg = error.message;
            break;
        }
      } else { // Something else, either an error making the request or a Network error.
        msg = error.message;
      }

      if (!resp || resp.status !== 403) { // 403's log we'll be handled somewhere else.
        log[request.logErrorsAsInfo ? 'info' : 'error'](`Response status is not OK. Status: ${resp ? resp.status : 'NO_STATUS'}. URL: ${url}. Message: ${msg}`);
      }

      // passes `undefined` as statusCode if not an HTTP error (resp === undefined)
      throw new SplitNetworkError(msg, resp && resp.status);
    }) : Promise.reject(new SplitNetworkError(messageNoFetch));
}
