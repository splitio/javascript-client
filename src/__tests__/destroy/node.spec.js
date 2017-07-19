const tape = require('tape');
const SplitFactory = require('../../');

tape('SDK destroy', async function (assert) {
  const config = {
    core: {
      authorizationKey: 'uoj4sb69bjv7d4d027f7ukkitd53ek6a9ai9'
    },
    urls: {
      sdk: 'https://sdk-aws-staging.split.io/api',
      events: 'https://events-aws-staging.split.io/api'
    },
    mode: 'standalone'
  };

  const factory = SplitFactory(config);
  const client = factory.client();
  const manager = factory.manager();

  await client.ready();

  client.getTreatment('ut1', 'FACUNDO_TEST');
  client.getTreatment('ut2', 'FACUNDO_TEST');
  client.getTreatment('ut3', 'FACUNDO_TEST');

  await client.destroy();

  assert.equal( client.getTreatment('ut1', 'FACUNDO_TEST'), 'control' );

  assert.equal( manager.splits().length , 0 );
  assert.equal( manager.names().length ,  0 );
  assert.equal( manager.split('FACUNDO_TEST') , null );

  assert.end();
});
