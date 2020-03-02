import tape from 'tape-catch';
import validateIntegrationsSettings from '../common';


tape('validateIntegrationsSettings', t => {

  // Check different types, since `integrations` param is defined by the user
  t.test('Returns an empty array if `integrations` is an invalid object', assert => {
    assert.deepEqual(validateIntegrationsSettings({ integrations: undefined }, ['INT_TYPE']), []);
    assert.deepEqual(validateIntegrationsSettings({ integrations: true }, ['INT_TYPE']), []);
    assert.deepEqual(validateIntegrationsSettings({ integrations: 123 }, ['INT_TYPE']), []);
    assert.deepEqual(validateIntegrationsSettings({ integrations: 'string' }, ['INT_TYPE']), []);
    assert.deepEqual(validateIntegrationsSettings({ integrations: {} }, ['INT_TYPE']), []);
    assert.deepEqual(validateIntegrationsSettings({ integrations: [] }, ['INT_TYPE']), []);
    assert.deepEqual(validateIntegrationsSettings({ integrations: [false, 0, Infinity, new Error(), () => { }, []] }, ['INT_TYPE']), []);
    assert.end();
  });

  t.test('Filters invalid integrations from `integrations` array', assert => {
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
      { integrations: [valid, validWithOptions, invalid] }), [],
    'All integrations are removed if no `validIntegrationTypes` array is passed');
    assert.deepEqual(validateIntegrationsSettings(
      { integrations: [valid, validWithOptions, otherValidWithOptions, invalid] }, ['INT1']),
    [valid, validWithOptions],
    'Integrations that do not have the passed types are removed');
    assert.deepEqual(validateIntegrationsSettings(
      { integrations: [invalid, valid, false, 0, validWithOptions, Infinity, new Error(), otherValidWithOptions, () => { }, [], invalid] }, ['INT1', 'INT2']),
    [valid, validWithOptions, otherValidWithOptions],
    'Integrations that do not have the passed types or are invalid objects are removed');
    assert.end();
  });

});
