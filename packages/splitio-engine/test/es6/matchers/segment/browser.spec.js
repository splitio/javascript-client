const matcherTypes = require('../../../../lib/matchers/types');
const matcherFactory = require('../../../../lib/matchers');
const tape = require('tape');

tape('MATCHER SEGMENT / should return true ONLY when the segment is defined inside the segment storage', assert => {
  const segment = 'employees';

  const matcher = matcherFactory({
    type: matcherTypes.enum.SEGMENT,
    value: segment
  }, {
    segments: {
      has(segmentName) {
        if (segmentName !== segment) {
          throw Error('Unexpected segment name');
        }

        return segment === segmentName;
      }
    }
  });

  assert.true(matcher(), 'segment found in mySegments list');
  assert.end();
});
