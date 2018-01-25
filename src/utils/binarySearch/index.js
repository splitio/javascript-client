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
function bs(items, value) {
  let startIndex = 0;
  let stopIndex = items.length - 1;
  let middle = Math.floor((stopIndex + startIndex) / 2);
  let minIndex = startIndex;
  let maxIndex = stopIndex;

  while (items[middle] !== value && startIndex < stopIndex) {
    // adjust search area
    if (value < items[middle]) {
      stopIndex = middle - 1;
    } else if (value > items[middle]) {
      startIndex = middle + 1;
    }

    // recalculate middle
    middle = Math.floor((stopIndex + startIndex) / 2);
  }

  // correct if middle is out of range
  if (middle < minIndex) {
    middle = minIndex;
  } else if (middle > maxIndex) {
    middle = maxIndex;
  }

  // we want to always return based on strict minor comparation
  if (value < items[middle] && middle > minIndex) {
    return middle - 1;
  }

  return middle;
}

export default bs;