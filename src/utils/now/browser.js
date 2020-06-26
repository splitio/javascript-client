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

function nowFactory() {
  // eslint-disable-next-line compat/compat
  if (typeof performance === 'object' && typeof performance.now === 'function') {
    // eslint-disable-next-line compat/compat
    return performance.now.bind(performance);
  } else {
    return Date.now;
  }
}

const now = nowFactory();

export default now;
