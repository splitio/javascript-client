import tape from 'tape-catch';
import { getFetch } from '../node';

tape('getFetch returns node-fetch module in Node', assert => {
  assert.equal(getFetch(), require('node-fetch'));

  assert.end();
});
