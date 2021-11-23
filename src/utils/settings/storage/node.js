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
import { LOCALHOST_MODE, STORAGE_PLUGGABLE, STORAGE_MEMORY, STORAGE_REDIS, CONSUMER_MODE, STANDALONE_MODE } from '../../constants';
import logFactory from '../../../utils/logger';
const log = logFactory('splitio-settings');

export function parseRedisOptions(options) {
  let {
    host,
    port,
    db,
    pass,
    url,
    connectionTimeout,
    operationTimeout
  } = options;

  if (process.env.REDIS_HOST)
    host = process.env.REDIS_HOST;
  if (process.env.REDIS_PORT)
    port = process.env.REDIS_PORT;
  if (process.env.REDIS_DB)
    db = process.env.REDIS_DB;
  if (process.env.REDIS_PASS)
    pass = process.env.REDIS_PASS;
  if (process.env.REDIS_URL)
    url = process.env.REDIS_URL;

  const newOpts = {
    connectionTimeout, operationTimeout
  };

  if (url) {
    newOpts.url = url;
  } else {
    newOpts.host = host;
    newOpts.port = port;
    newOpts.db = db;
    newOpts.pass = pass;
  }
  return newOpts;
}


const ParseStorageSettings = (settings) => {
  let {
    mode,
    storage: {
      type,
      options = {},
      prefix
    }
  } = settings;

  if (prefix) {
    prefix += '.SPLITIO';
  } else {
    prefix = 'SPLITIO';
  }

  // In localhost mode we should force the user to use the MEMORY storage
  if (mode === LOCALHOST_MODE) return {
    type: STORAGE_MEMORY,
    prefix
  };

  const fallbackToMemory = () => {
    log.error('The provided storage is invalid. It requires consumer mode. Fallbacking into default MEMORY storage.');
    return {
      type: STORAGE_MEMORY,
      prefix
    };
  };

  // In other cases we can have MEMORY, REDIS or PLUGGABLE
  switch (type) {
    case STORAGE_REDIS:
      if (mode === STANDALONE_MODE) return fallbackToMemory();
      else return {
        type,
        prefix,
        options: parseRedisOptions(options)
      };

    // For pluggable storage, we return the original storage options, without updating
    // the prefix because it is done internally by the PluggableStorage module.
    case STORAGE_PLUGGABLE:
      if (mode === STANDALONE_MODE) return fallbackToMemory();
      else return settings.storage;

    // For now, we don't have modifiers or settings for MEMORY in NodeJS
    case STORAGE_MEMORY:
    default: {
      // Consumer mode requires an async storage
      if (mode === CONSUMER_MODE) throw new Error('A Pluggable or Redis storage is required on consumer mode');
      return {
        type: STORAGE_MEMORY,
        prefix
      };
    }
  }
};

export default ParseStorageSettings;
