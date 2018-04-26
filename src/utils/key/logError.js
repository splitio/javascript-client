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
import isObject from 'lodash/isObject';
import isFinite from 'lodash/isFinite';
import sanatize from './sanatize';
import logFactory from '../logger';
const log = logFactory('splitio-client');

function keyLogError(prefix, key) {
  if (key === null || key === undefined) {
    log.error(`${prefix}: key cannot be null`);
  }

  if (isObject(key)) {
    if (sanatize(key.matchingKey) === false || sanatize(key.bucketingKey) === false) {
      log.error(`${prefix}: key should be an object with bucketingKey and matchingKey with valid string properties`);
    }
  }

  if (isFinite(key)) {
    log.warn(`${prefix}: key ${key} is not of type string, converting to string`);
  }

  if (sanatize(key) === false) {
    log.error(`${prefix}: key has to be of type string`);
  }
}

export default keyLogError;