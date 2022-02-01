import tape from 'tape-catch';
import { getFetch } from '../browser';

tape('getFetch returns global fetch in Browser', assert => {
  assert.equal(getFetch(), fetch);

  assert.end();
});
