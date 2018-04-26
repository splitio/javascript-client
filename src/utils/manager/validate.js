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
import isString from 'lodash/isString';
import logFactory from '../logger';
const log = logFactory('splitio-client');

function managerValidate(splitName) {
  if (splitName === null || splitName === undefined) {
    log.error('split: split_name cannot be null');
    return false;
  }

  if (!isString(splitName)) {
    log.error('split: split_name X must be a string');
    return false;
  }

  return true;
}

export default managerValidate;