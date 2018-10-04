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
import tape from 'tape-catch';
import logFactory, { API } from '../../logger';
import { Logger } from '../../logger/LoggerFactory';

// We'll set this only once, is the constant we will use for
// comparing the LogLevel values.
export const LOG_LEVELS = {
  'DEBUG': 'DEBUG',
  'INFO':  'INFO',
  'WARN':  'WARN',
  'ERROR': 'ERROR',
  'NONE': 'NONE'
};

tape('SPLIT LOGGER / methods and props', assert => {

  assert.equal(typeof logFactory, 'function', 'Importing the module should return a function.');

  assert.equal(typeof API, 'object', 'Our logger should expose an API object.');
  assert.equal(typeof API.enable, 'function', 'API object should have enable method.');
  assert.equal(typeof API.disable, 'function', 'API object should have disable method.');
  assert.equal(typeof API.setLogLevel, 'function', 'API object should have setLogLevel method.');
  assert.deepEqual(API.LogLevel, LOG_LEVELS, 'API object should have LogLevel prop including all available levels.');

  assert.end();
});

tape('SPLIT LOGGER / create factory returned instance', assert => {
  const logger = logFactory('category', {});

  assert.ok(logger instanceof Logger, 'Our logger should expose an API object.');

  assert.end();
});
