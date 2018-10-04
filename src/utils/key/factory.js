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
 * Verify type of key and return the set key property
 * If shouldReturnUndefined === true will return undefined
 * Use case: impressions tracker need matching key or bucketing key.
 */
function KeyFactory(keyProperty, shouldReturnUndefined = false) {
  return function getKeyProperty(key) {
    if (isObject(key)) {
      return sanatize(key[keyProperty]);
    }

    return shouldReturnUndefined ? undefined : sanatize(key);
  };
}

export const matching = KeyFactory('matchingKey');
export const bucketing = KeyFactory('bucketingKey', true);
