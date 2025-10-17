import tape from 'tape-catch';
import { getFetch } from '../node';


tape('getFetch returns node-fetch module in Node', async assert => {
  // @TODO: not working as expected. Both are `fetch` but different function instances?
  // const nodeFetch = await eval("import('node-fetch')");
  // assert.equal(getFetch(), nodeFetch.default);

  assert.equal(getFetch().name, 'nodeFetch');

  assert.end();
});
