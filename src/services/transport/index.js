/**
Copyright 2016 Split Software

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
**/
import axios from 'axios';
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

      throw Error(`${resp ? `${resp.status} - ` : ''}${msg}`);
    });
}
