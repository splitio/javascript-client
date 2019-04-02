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

import { SplitTimeoutError } from '../lang/Errors';

function timeout(ms, promise) {
  if (ms < 1) return promise;

  return new Promise((resolve, reject) => {
    const tid = setTimeout(() => {
      reject(new SplitTimeoutError(`Operation timed out because it exceeded the configured time limit of ${ms}ms.`));
    }, ms);

    promise.then((res) => {
      clearTimeout(tid);
      resolve(res);
    },
    (err) => {
      clearTimeout(tid);
      reject(err);
    });
  });
}

export default timeout;
