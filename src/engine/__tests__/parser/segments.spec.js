import tape from 'tape-catch';
import parseSegments from '../../parser/segments';

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

  assert.ok( segments['A'] );
  assert.ok( segments['B'] );
  assert.end();

});