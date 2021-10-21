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

// @WARNING Symbol is not correctly working in PhantomJS
export const matcherTypes = {
  UNDEFINED: 0,
  ALL_KEYS: 1,
  IN_SEGMENT: 2,
  WHITELIST: 3,
  EQUAL_TO: 4,
  GREATER_THAN_OR_EQUAL_TO: 5,
  LESS_THAN_OR_EQUAL_TO: 6,
  BETWEEN: 7,
  EQUAL_TO_SET: 8,
  CONTAINS_ANY_OF_SET: 9,
  CONTAINS_ALL_OF_SET: 10,
  PART_OF_SET: 11,
  ENDS_WITH: 12,
  STARTS_WITH: 13,
  CONTAINS_STRING: 14,
  IN_SPLIT_TREATMENT: 15,
  EQUAL_TO_BOOLEAN: 16,
  MATCHES_STRING: 17
};

export const matcherDataTypes = {
  BOOLEAN: 'BOOLEAN',
  STRING: 'STRING',
  NUMBER: 'NUMBER',
  SET: 'SET',
  DATETIME: 'DATETIME',
  NOT_SPECIFIED: 'NOT_SPECIFIED'
};

export function matcherTypesMapper(matcherType) {
  const type = matcherTypes[matcherType];
  if (type) return type;
  else return matcherTypes.UNDEFINED;
}
