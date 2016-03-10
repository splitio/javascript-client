const matcherTypes = require('../../../../lib/matchers/types');
const matcherFactory = require('../../../../lib/matchers');
const tape = require('tape');

tape('MATCHER SEGMENT / should return true ONLY when the key is defined inside the segment', assert => {
  const segment = 'employees';

  const matcher = matcherFactory({
    type: matcherTypes.enum.SEGMENT,
    value: segment
  }, {
    segments: {
      get(segmentName) {
        if (segmentName !== segment) {
          throw Error('Unexpected segment name');
        }

        return new Set(['key']);
      }
    }
  });

  assert.true(matcher('key'), '"key" should be true');
  assert.false(matcher('another_key'), '"another key" should be false');
  assert.end();
});
