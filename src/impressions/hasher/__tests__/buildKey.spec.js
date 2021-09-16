import tape from 'tape-catch';
import { buildKey } from '../buildKey';

tape('buildKey', assert => {
  assert.equal(buildKey({}), 'undefined:undefined:undefined:undefined:undefined');

  const imp = {
    feature: 'feature_0',
    keyName: 'key_0',
    changeNumber: 0,
    label: 'in segment all',
    treatment: 'someTreatment',
  };
  assert.equal(buildKey(imp), 'key_0:feature_0:someTreatment:in segment all:0');

  assert.end();
});
