import tape from 'tape-catch';
import sinon from 'sinon';
import { getFetch, __setFetch } from '../node';

tape('getFetch returns a wrapped node-fetch module in Node', assert => {
  assert.equal(typeof getFetch(), 'function');

  assert.end();
});

tape('getFetch passes an agent object to HTTPs requests', assert => {
  const fetchMock = sinon.stub();
  __setFetch(fetchMock);

  const fetch = getFetch();

  fetch('http://test.com');
  assert.true(fetchMock.calledWithExactly('http://test.com', { agent: undefined }));

  fetch('https-https://', { option: 'value' });
  assert.true(fetchMock.calledWithExactly('https-https://', { option: 'value', agent: undefined }));

  fetch('https://test.com');
  assert.true(fetchMock.calledWithExactly('https://test.com', { agent: sinon.match.object }));

  fetch('https://test.com', { option: 'value' });
  assert.true(fetchMock.calledWithExactly('https://test.com', { option: 'value', agent: sinon.match.object }));

  // Restore
  __setFetch(require('node-fetch'));

  assert.end();
});
