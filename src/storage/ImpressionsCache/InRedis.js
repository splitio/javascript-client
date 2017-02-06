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
// @flow

'use strict';

const processPipelineAnswer = (results: Array<[any, Array<string>]>): Array<string> =>
  results.reduce((accum, [err, value]) => {
    if (err === null) {
      try {
        return accum.concat(value.map(JSON.parse));
      } catch(e) {}
    }
    return accum;
  }, []);

class ImpressionsCacheInRedis {
  keys: KeyBuilder;
  redis: IORedis;

  constructor(keys: KeyBuilder, redis: IORedis) {
    this.keys = keys;
    this.redis = redis;
  }

  scanKeys(): Promise {
    return this.redis.keys(this.keys.searchPatternForImpressions());
  }

  state(): Promise {
    return this.scanKeys().then((listOfKeys: Array<string>) => this.redis.pipeline(listOfKeys.map(k => ['smembers', k])).exec()).then(processPipelineAnswer);
  }

  track(impression: KeyImpression): Promise {
    return this.redis.sadd(
      this.keys.buildImpressionsKey(impression.feature),
      JSON.stringify(impression)
    );
  }

  clear(): Promise {
    return this.scanKeys().then((listOfKeys: Array<string>) => {
      if (listOfKeys.length)
        return this.redis.del(listOfKeys);
    });
  }

  toJSON(): Array<any> {
    return this.state();
  }

  isEmpty() {
    return this.scanKeys().then(els => els.length === 0);
  }
}

module.exports = ImpressionsCacheInRedis;
