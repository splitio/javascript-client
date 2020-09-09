import tape from 'tape-catch';
import { truncateTimeFrame } from '../../time';

tape('Test truncateTimeFrame', assert => {
  assert.equal(truncateTimeFrame(new Date(2020, 9, 2, 10, 53, 12).getTime()), new Date(2020, 9, 2, 10, 0, 0).getTime());
  assert.equal(truncateTimeFrame(new Date(2020, 9, 2, 10, 0, 0).getTime()), new Date(2020, 9, 2, 10, 0, 0).getTime());
  assert.equal(truncateTimeFrame(new Date(2020, 9, 2, 10, 53, 0).getTime()), new Date(2020, 9, 2, 10, 0, 0).getTime());
  assert.equal(truncateTimeFrame(new Date(2020, 9, 2, 10, 0, 12).getTime()), new Date(2020, 9, 2, 10, 0, 0).getTime());
  assert.equal(truncateTimeFrame(new Date(1970, 1, 0, 0, 0, 0).getTime()), new Date(1970, 1, 0, 0, 0, 0).getTime());

  assert.end();
});