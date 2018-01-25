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
'use strict';

import 'isomorphic-fetch';
import baseline from './options';

function RequestFactory(settings, relativeUrl, params) {
  const token = settings.core.authorizationKey;
  const version = settings.version;
  const { ip, hostname } = settings.runtime;
  const headers = {};

  headers['Accept'] = 'application/json';
  headers['Content-Type'] = 'application/json';
  headers['Authorization'] = `Bearer ${token}`;
  headers['SplitSDKVersion'] = version;

  if (ip) headers['SplitSDKMachineIP'] = ip;
  if (hostname) headers['SplitSDKMachineName'] = hostname;

  return new Request(settings.url(relativeUrl), Object.assign({
    headers,
    compress: true
  },
  baseline,
  params
  ));
}

export default RequestFactory;
