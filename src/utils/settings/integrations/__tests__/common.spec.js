import tape from 'tape-catch';
import validateIntegrationsSettings from '../common';


tape('validateIntegrationsSettings', t => {

  // Check different types, since `integrations` param is defined by the user
  t.test('Return undefined if not a non-empty array as `integrations`', assert => {
    assert.equal(validateIntegrationsSettings({ integrations: undefined }, ['INT_TYPE']), undefined);
    assert.equal(validateIntegrationsSettings({ integrations: true }, ['INT_TYPE']), undefined);
    assert.equal(validateIntegrationsSettings({ integrations: 123 }, ['INT_TYPE']), undefined);
    assert.equal(validateIntegrationsSettings({ integrations: 'string' }, ['INT_TYPE']), undefined);
    assert.equal(validateIntegrationsSettings({ integrations: {} }, ['INT_TYPE']), undefined);
    assert.equal(validateIntegrationsSettings({ integrations: [] }, ['INT_TYPE']), undefined);
    assert.end();
  });

  t.test('Filter invalid integrations from `integrations` array', assert => {
    const valid = {
      type: 'INT1',
    };
    const validWithOptions = {
      type: 'INT1',
      param1: 'param1',
      param2: 'param2',
    };
    const otherValidWithOptions = {
      type: 'INT2',
      param1: 'param1',
      param2: 'param2',
    };
    const invalid = {
      param3: 'param3',
    };

    assert.deepEqual(validateIntegrationsSettings(
      { integrations: [valid, validWithOptions, invalid] }), undefined,
    'All integrations are removed if no `validIntegrationTypes` array is passed');
    assert.deepEqual(validateIntegrationsSettings(
      { integrations: [valid, validWithOptions, otherValidWithOptions, invalid] }, ['INT1']),
    [valid, validWithOptions],
    'Integrations that not have the passed types are removed');
    assert.deepEqual(validateIntegrationsSettings(
      { integrations: [invalid, valid, validWithOptions, otherValidWithOptions, invalid] }, ['INT1', 'INT2']),
    [valid, validWithOptions, otherValidWithOptions],
    'Integrations that not have the passed types are removed');
    assert.end();
  });

});
