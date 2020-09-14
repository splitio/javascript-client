import tape from 'tape-catch';
import hasher from '../browser';

tape('Hasher 32 / Impression Hasher Works', assert => {
  const imp1 = {
    feature: 'someFeature',
    keyName: 'someKey',
    changeNumber: 123,
    label: 'someLabel',
    treatment: 'someTreatment',
  };

  // Same Impression
  const imp2 = {
    feature: 'someFeature',
    keyName: 'someKey',
    changeNumber: 123,
    label: 'someLabel',
    treatment: 'someTreatment',
  };
  assert.equal(hasher.hashImpression32(imp1), hasher.hashImpression32(imp2));

  // Different feature
  imp2.feature = 'someOtherFeature';
  assert.notEqual(hasher.hashImpression32(imp1), hasher.hashImpression32(imp2));

  // Different key
  imp2.feature = imp1.feature;
  imp2.keyName = 'someOtherKey';
  assert.notEqual(hasher.hashImpression32(imp1), hasher.hashImpression32(imp2));

  // Different changeNumber
  imp2.keyName = imp1.keyName;
  imp2.changeNumber = 456;
  assert.notEqual(hasher.hashImpression32(imp1), hasher.hashImpression32(imp2));

  // Different label
  imp2.changeNumber = imp1.changeNumber;
  imp2.label = 'someOtherLabel';
  assert.notEqual(hasher.hashImpression32(imp1), hasher.hashImpression32(imp2));

  // Different Treatment
  imp2.label = imp1.label;
  imp2.treatment = 'someOtherTreatment';
  assert.notEqual(hasher.hashImpression32(imp1), hasher.hashImpression32(imp2));

  assert.end();
});

tape('Hasher 32 / Impression Hasher Does Not Crash', assert => {
  const imp1 = {
    feature: 'someFeature',
    keyName: 'someKey',
    changeNumber: 123,
    label: 'someLabel',
    treatment: 'someTreatment',
  };

  imp1.keyName = null;
  assert.isNot(hasher.hashImpression32(imp1), null);

  imp1.changeNumber = null;
  assert.isNot(hasher.hashImpression32(imp1), null);

  imp1.label = null;
  assert.isNot(hasher.hashImpression32(imp1), null);

  imp1.treatment = null;
  assert.isNot(hasher.hashImpression32(imp1), null);

  assert.is(hasher.hashImpression32(null), null);

  assert.end();
});
