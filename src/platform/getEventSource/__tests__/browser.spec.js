import tape from 'tape-catch';
import { getEventSource } from '../browser';

tape('getEventSource returns global EventSource in Browser', assert => {
  assert.equal(getEventSource(), EventSource);

  assert.end();
});
