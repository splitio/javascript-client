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

const ParseStorageSettings = (settings) => {
  const {
    mode,
    storage: {
      type, options = {}
    }
  } = settings;

  if (mode === 'localhost') return {
    type: 'MEMORY'
  };

  switch (type) {
    case 'REDIS': {
      let {
        host,
        port,
        pass,
        url
      } = options;

      if (process.env.REDIS_HOST)
        host = process.env.REDIS_HOST;
      if (process.env.REDIS_PORT)
        port = process.env.REDIS_PORT;
      if (process.env.REDIS_PASS)
        pass = process.env.REDIS_PASS;
      if (process.env.REDIS_URL)
        url = process.env.REDIS_URL;

      if (url) return {
        type,
        options: url
      };

      return {
        type,
        options: {
          host,
          port,
          pass
        }
      };
    }

    case 'MEMORY':
    default: {
      return undefined;
    }
  }
};

module.exports = ParseStorageSettings;
