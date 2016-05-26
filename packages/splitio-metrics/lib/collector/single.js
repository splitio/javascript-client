"use strict";

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

function SingleCollector() {
  this.clear();
}

// counter based on the internal ranges
SingleCollector.prototype.state = function () /*: number */{
  return this.counter;
};

// increment counter
SingleCollector.prototype.track = function () /*: number */{
  return ++this.counter;
};

// recycle the collector (reset using 0)
SingleCollector.prototype.clear = function () /*: SingleCollector */{
  this.counter = 0;

  return this;
};

// hook JSON.stringify to expose the state of the counter
SingleCollector.prototype.toJSON = function () {
  return this.counter;
};

// Check if the is data changed from the defaults
SingleCollector.prototype.isEmpty = function () {
  return this.counter === 0;
};

module.exports = function SingleCollectorFactory() {
  return new SingleCollector();
};