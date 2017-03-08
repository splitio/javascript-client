// @flow

'use strict';

const tape = require('tape-catch');
const parseSegments = require('../../parser/segments');

tape('PARSER / segments parser', assert => {

  const segments = parseSegments([{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        matcherType: 'IN_SEGMENT',
        userDefinedSegmentMatcherData: {
          segmentName: 'A'
        }
      }, {
        matcherType: 'IN_SEGMENT',
        userDefinedSegmentMatcherData: {
          segmentName: 'B'
        }
      }]
    }
  }]);

  assert.ok( segments.has('A') );
  assert.ok( segments.has('B') );
  assert.end();

});
