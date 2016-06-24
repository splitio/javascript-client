"use strict";

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

function repeat(fn, delay) {
  for (var _len = arguments.length, rest = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    rest[_key - 2] = arguments[_key];
  }

  var tid = void 0;
  var stopped = false;

  function next() {
    for (var _len2 = arguments.length, rest = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      rest[_key2 - 1] = arguments[_key2];
    }

    var _delay = arguments.length <= 0 || arguments[0] === undefined ? delay : arguments[0];

    if (!stopped) {
      // IE 9 doesn't support function arguments through setTimeout call.
      // https://msdn.microsoft.com/en-us/library/ms536753(v=vs.85).aspx
      tid = setTimeout(function () {
        fn.apply(undefined, rest.concat([next]));
      }, _delay);
    }
  }

  function till() {
    clearTimeout(tid);
    stopped = true;
  }

  fn.apply(undefined, rest.concat([next]));

  return till;
}

module.exports = repeat;