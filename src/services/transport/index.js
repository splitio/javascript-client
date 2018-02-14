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
  return axios(request).then(resp => {
    if (resp.statusText === 'OK') {
      return resp;
    } else {
      let message = '';
      switch (resp.status) {
        case 403: message = 'Forbidden operation. Check API key permissions.';
          break;
        case 404: message = 'Invalid API key or resource not found.';
          break;
        default: message = resp.statusText;
          break;
      }

      log.error(`Response status is not OK. Status: ${resp.status}. URL: ${resp.config.url}. Message: ${message}`);

      throw Error(`${resp.status} - ${message}`);
    }
  });
}
