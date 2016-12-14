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

var counter = 0;

function repeat(fn, delay, ...rest) {
  let tid;
  let stopped = false;
  let c = ++counter;

  function next(_delay = delay, ...rest) {
    if (!stopped) {
      console.log(`xxx ${c} repeat`);
      // IE 9 doesn't support function arguments through setTimeout call.
      // https://msdn.microsoft.com/en-us/library/ms536753(v=vs.85).aspx
      tid = setTimeout(() => {
        console.log(`xxx ${c} repeat repeat`);
        fn(...rest, next);
      }, _delay);
    } else {
      console.log(`xxx ${c} called next but stopped`);
    }
  }

  function till() {
    clearTimeout(tid);
    tid = undefined;
    stopped = true;
    console.log(`xxx ${c} till called`);
  }

  fn(...rest, next);

  return till;
}

module.exports = repeat;
