import tape from 'tape-catch';
import { getEventSource } from '../node';

tape('getEventSource returns eventsource module in Node', assert => {
  assert.equal(getEventSource(), require('eventsource'));

  assert.end();
});
