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

function url(target) {
  if ('stage' === process.env.NODE_ENV) {
    return 'https://sdk-staging.split.io/api' + target;
  } else if ('production' === process.env.NODE_ENV) {
    return 'https://sdk.split.io/api' + target;
  } else if ('loadtesting' === process.env.NODE_ENV) {
    return 'https://sdk-loadtesting.split.io/api' + target;
  } else {
    return 'http://localhost:8081/api' + target;
  }
}

module.exports = url;
//# sourceMappingURL=index.js.map