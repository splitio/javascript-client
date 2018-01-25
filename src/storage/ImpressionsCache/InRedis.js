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

const processPipelineAnswer = (results) =>
  results.reduce((accum, [err, value]) => {
    if (err === null) {
      try {
        return accum.concat(value.map(JSON.parse));
      } catch(e) {
        // noop
      }
    }
    return accum;
  }, []);

class ImpressionsCacheInRedis {

  constructor(keys, redis) {
    this.keys = keys;
    this.redis = redis;
  }

  scanKeys() {
    return this.redis.keys(this.keys.searchPatternForImpressions());
  }

  state() {
    return this.scanKeys().then((listOfKeys) => this.redis.pipeline(listOfKeys.map(k => ['smembers', k])).exec()).then(processPipelineAnswer);
  }

  track(impression) {
    return this.redis.sadd(
      this.keys.buildImpressionsKey(impression.feature),
      JSON.stringify(impression)
    );
  }

  clear() {
    return this.scanKeys().then((listOfKeys) => {
      if (listOfKeys.length)
        return this.redis.del(listOfKeys);
    });
  }

  toJSON() {
    return this.state();
  }

  isEmpty() {
    return this.scanKeys().then(els => els.length === 0);
  }
}

export default ImpressionsCacheInRedis;
