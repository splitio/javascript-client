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

module.exports = {
  // @WARNING Symbol is not correctly working in PhantomJS
  enum: {
    ALL: 1,
    SEGMENT: 2,
    WHITELIST: 3,
    EQUAL_TO: 4,
    GREATER_THAN_OR_EQUAL_TO: 5,
    LESS_THAN_OR_EQUAL_TO: 6,
    BETWEEN: 7,
    UNDEFINED: 8,
    EQUAL_TO_SET: 9,
    CONTAINS_ANY_OF_SET: 10,
    CONTAINS_ALL_OF_SET: 11,
    PART_OF_SET: 12,
    ENDS_WITH: 13,
    STARTS_WITH: 14,
    CONTAINS_STRING: 15
  },

  mapper(matcherType: string): number {
    let types = this.enum;

    switch (matcherType) {
      case 'ALL_KEYS':
        return types.ALL;
      case 'IN_SEGMENT':
        return types.SEGMENT;
      case 'WHITELIST':
        return types.WHITELIST;
      case 'EQUAL_TO':
        return types.EQUAL_TO;
      case 'GREATER_THAN_OR_EQUAL_TO':
        return types.GREATER_THAN_OR_EQUAL_TO;
      case 'LESS_THAN_OR_EQUAL_TO':
        return types.LESS_THAN_OR_EQUAL_TO;
      case 'BETWEEN':
        return types.BETWEEN;
      case 'EQUAL_TO_SET':
        return types.EQUAL_TO_SET;
      case 'CONTAINS_ANY_OF_SET':
        return types.CONTAINS_ANY_OF_SET;
      case 'CONTAINS_ALL_OF_SET':
        return types.CONTAINS_ALL_OF_SET;
      case 'PART_OF_SET':
        return types.PART_OF_SET;
      case 'ENDS_WITH':
        return types.ENDS_WITH;
      case 'STARTS_WITH':
        return types.STARTS_WITH;
      case 'CONTAINS_STRING':
        return types.CONTAINS_STRING;
      default:
        return types.UNDEFINED;
    }
  }
};
