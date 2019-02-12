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
import { isObject } from '../lang';

/**
 * Verify type of key and return the set key property
 * If undefinedIfNotObj === true, it means that unless explicitly defined (using the Key object)
 * we will return undefined. (if it was a string, there's no bucketingKey)
 */
function KeyGetterFactory(keyProperty, undefinedIfNotObj = false) {
  return function getKeyProperty(key) {
    if (isObject(key)) {
      return key[keyProperty];
    }

    return undefinedIfNotObj ? undefined : key;
  };
}

export const matching = KeyGetterFactory('matchingKey');
export const bucketing = KeyGetterFactory('bucketingKey', true);
