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
import sanatize from './sanatize';

/**
 * Verify type of key and return a valid object key used for get treatment for a
 * specific split.
 */
export default (key) => {
  if (isObject(key)) {
    // If we've received an object, we will sanatizes the value of each property
    const keyObject = {
      matchingKey: sanatize(key.matchingKey),
      bucketingKey: sanatize(key.bucketingKey)
    };

    // and if they've resulted on a invalid type of key we will return false
    if (keyObject.bucketingKey === false || keyObject.matchingKey === false) {
      return false;
    }

    return keyObject;
  }

  const sanatizedKey = sanatize(key);

  // sanatize would return false if the key is invalid
  if (sanatizedKey !== false) {
    return {
      matchingKey: sanatizedKey,
      bucketingKey: sanatizedKey
    };
  }

  return false;
};
