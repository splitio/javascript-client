'use strict';

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

var log = require('debug')('splitio-services:service');

function Context(Transport) {
  return function Fetcher(request) {
    return Transport(request).then(function (resp) {
      if (resp.statusText === 'OK') {
        return resp;
      } else {
        log('throw error because status text is not OK');

        throw Error(resp.statusText);
      }
    });
  };
}

module.exports = Context;
//# sourceMappingURL=service.js.map