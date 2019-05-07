import axios from 'axios';
import { SplitNetworkError } from '../../utils/lang/Errors';
import logFactory from '../../utils/logger';
const log = logFactory('splitio-services:service');

export default function Fetcher(request) {
  return axios(request)
    .catch(error => {
      const resp = error.response;
      const config = error.config;
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

      if (!resp || resp.status !== 403) // 403's log we'll be handled somewhere else.
        log.error(`Response status is not OK. Status: ${resp ? resp.status : 'NO_STATUS'}. URL: ${config.url}. Message: ${msg}`);

      throw new SplitNetworkError(msg, resp ? resp.status : 'NO_STATUS');
    });
}
