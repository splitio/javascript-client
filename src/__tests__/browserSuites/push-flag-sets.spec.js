import { SplitFactory } from '../..';
import EventSourceMock, { setMockListener } from '../testUtils/eventSourceMock';
window.EventSource = EventSourceMock;

import notification1 from '../mocks/message.SPLIT_UPDATE.FS.1.json';
import notification2 from '../mocks/message.SPLIT_UPDATE.FS.2.json';
import notification3 from '../mocks/message.SPLIT_UPDATE.FS.3.json';
import notification4None from '../mocks/message.SPLIT_UPDATE.FS.4None.json';
import notification4 from '../mocks/message.SPLIT_UPDATE.FS.4.json';
import notification5 from '../mocks/message.SPLIT_UPDATE.FS.5.json';
import notification6 from '../mocks/message.SPLIT_UPDATE.FS.6.json';
import notificationKill from '../mocks/message.SPLIT_UPDATE.FS.kill.json';

import authPushEnabled from '../mocks/auth.pushEnabled.nicolas@split.io.json';

const baseUrls = {
  sdk: 'https://sdk.baseurl',
  auth: 'https://auth.baseurl/api'
};

const baseConfig = {
  core: {
    authorizationKey: '<fake-token>',
    key: 'nicolas@split.io'
  },
  urls: baseUrls,
};

const MILLIS_FIRST_SPLIT_UPDATE_EVENT = 100;
const MILLIS_SECOND_SPLIT_UPDATE_EVENT = 200;
const MILLIS_THIRD_SPLIT_UPDATE_EVENT = 300;
const MILLIS_FOURTH_SPLIT_UPDATE_EVENT = 400;
const MILLIS_FIFTH_SPLIT_UPDATE_EVENT = 500;


export function testFlagSets(fetchMock, t) {
  fetchMock.reset();

  fetchMock.get(baseUrls.sdk + '/memberships/nicolas%40split.io', { status: 200, body: { 'ms': {} } });

  fetchMock.get(baseUrls.auth + '/v2/auth?s=1.3&users=nicolas%40split.io', function () {
    return { status: 200, body: authPushEnabled };
  });
  fetchMock.get(baseUrls.sdk + '/splitChanges?s=1.3&since=-1&rbSince=-1',  function () {
    return { status: 200, body: { ff: { d: [], s: -1, t: 0 }}};
  });
  fetchMock.get(baseUrls.sdk + '/splitChanges?s=1.3&since=0&rbSince=-1',  function () {
    return { status: 200, body: { ff: { d: [], s: 0, t: 1 } }};
  });
  fetchMock.get(baseUrls.sdk + '/splitChanges?s=1.3&since=-1&rbSince=-1&sets=set_1,set_2',  function () {
    return { status: 200, body: { ff: { d: [], s: -1, t: 0 } }};
  });
  fetchMock.get(baseUrls.sdk + '/splitChanges?s=1.3&since=0&rbSince=-1&sets=set_1,set_2',  function () {
    return { status: 200, body: { ff: { d: [], s: 0, t: 1 } }};
  });


  const configWithSets = {
    ...baseConfig,
    sync: {
      splitFilters: [{type: 'bySet', values: ['set_1', 'set_2']}]
    }
  };

  t.test(async (assert) => {

    let splitio, client, manager = [];

    setMockListener((eventSourceInstance) => {
      eventSourceInstance.emitOpen();

      setTimeout(() => {
        assert.deepEqual(manager.splits(), [], '1 - initialized without flags');
        client.once(client.Event.SDK_UPDATE, async () => {
          assert.equal(manager.splits().length, 1, '1 - update is processed and the flag is stored');
          await client.destroy();
          assert.end();
        });
        eventSourceInstance.emitMessage(notification1);
      }, MILLIS_FIRST_SPLIT_UPDATE_EVENT);

    });

    splitio = SplitFactory(baseConfig);
    client = splitio.client();
    manager = splitio.manager();

  }, 'SDK with no sets configured does not exclude updates');

  t.test(async (assert) => {

    let splitio, client, manager = [];

    setMockListener((eventSourceInstance) => {
      eventSourceInstance.emitOpen();

      setTimeout(() => {
        assert.deepEqual(manager.splits(), [], '2 - initialized without flags');
        // Receive a SPLIT_UPDATE with "sets":["set_1", "set_2"]
        client.once(client.Event.SDK_UPDATE, () => {
          assert.deepEqual(manager.split('workm').sets, ['set_1', 'set_2'], '2 - update is processed and the flag is stored');
        });
        eventSourceInstance.emitMessage(notification2);
      }, MILLIS_FIRST_SPLIT_UPDATE_EVENT);

      setTimeout(() => {
        // Receive a SPLIT_UPDATE with "sets":["set_1"]
        client.once(client.Event.SDK_UPDATE, () => {
          assert.deepEqual(manager.split('workm').sets, ['set_1'], '2 - update is processed and the flag is updated');
        });
        eventSourceInstance.emitMessage(notification3);
      }, MILLIS_SECOND_SPLIT_UPDATE_EVENT);

      setTimeout(() => {
        // Receive a SPLIT_UPDATE with "sets":[]
        client.once(client.Event.SDK_UPDATE, async () => {
          assert.deepEqual(manager.splits().length, 0, '2 - update is processed and the flag is removed');
          await client.destroy();
          assert.end();
        });
        eventSourceInstance.emitMessage(notification4None);
      }, MILLIS_THIRD_SPLIT_UPDATE_EVENT);

    });

    splitio = SplitFactory(configWithSets);
    client = splitio.client();
    manager = splitio.manager();

  }, 'SDK with sets configured deletes flag when change with empty sets is received');

  t.test(async (assert) => {

    let splitio, client, manager = [];

    setMockListener((eventSourceInstance) => {
      eventSourceInstance.emitOpen();

      setTimeout(() => {
        assert.deepEqual(manager.splits(), [], '3 - initialized without flags');
        // Receive a SPLIT_UPDATE with "sets":["set_1", "set_2"]
        client.once(client.Event.SDK_UPDATE, () => {
          assert.deepEqual(manager.split('workm').sets, ['set_1', 'set_2'], '3 - update is processed and the flag is stored');
        });
        eventSourceInstance.emitMessage(notification2);
      }, MILLIS_FIRST_SPLIT_UPDATE_EVENT);

      setTimeout(() => {
        // Receive a SPLIT_UPDATE with "sets":["set_1"]
        client.once(client.Event.SDK_UPDATE, () => {
          assert.deepEqual(manager.split('workm').sets, ['set_1'], '3 - update is processed and the flag is updated');
        });
        eventSourceInstance.emitMessage(notification3);
      }, MILLIS_SECOND_SPLIT_UPDATE_EVENT);

      setTimeout(() => {
        // Receive a SPLIT_UPDATE with "sets":["set_3"]
        client.once(client.Event.SDK_UPDATE, () => {
          assert.deepEqual(manager.splits().length, 0, '3 - update is processed and the flag is removed');
        });
        eventSourceInstance.emitMessage(notification4);
      }, MILLIS_THIRD_SPLIT_UPDATE_EVENT);

      setTimeout(() => {
        // Receive a SPLIT_UPDATE with "sets":["set_3", "set_4"]
        // should not emit SPLIT_UPDATE
        // Receive a SPLIT_UPDATE with "sets":["set_1", "set_2"] from next test notification
        client.once(client.Event.SDK_UPDATE, async () => {
          assert.deepEqual(manager.split('workm').sets, ['set_1', 'set_2'], '3 - update is processed and the flag is stored');
          await client.destroy();
          assert.end();
        });
        eventSourceInstance.emitMessage(notification5);
      }, MILLIS_FOURTH_SPLIT_UPDATE_EVENT);

      setTimeout(() => {
        // emit  a SPLIT_UPDATE with "sets":["set_1", "set_2"]
        eventSourceInstance.emitMessage(notification6);
      }, MILLIS_FIFTH_SPLIT_UPDATE_EVENT);

    });

    splitio = SplitFactory(configWithSets);
    client = splitio.client();
    manager = splitio.manager();

  }, 'SDK with sets configured deletes flag when change with non-matching sets is received');

  t.test(async (assert) => {


    fetchMock.getOnce(baseUrls.sdk + '/splitChanges?s=1.3&since=2&rbSince=-1&sets=set_1,set_2',  function () {
      assert.pass('4 - A fetch is triggered due to the SPLIT_KILL');
      return { status: 200, body: { ff: { d: [], s: 2, t: 3 } }};
    });

    let splitio, client, manager = [];

    setMockListener((eventSourceInstance) => {
      eventSourceInstance.emitOpen();

      setTimeout(() => {
        assert.deepEqual(manager.splits(), [], '4 - initialized without flags');
        // Receive a SPLIT_UPDATE with "sets":["set_1", "set_2"]
        client.once(client.Event.SDK_UPDATE, () => {
          assert.equal(manager.split('workm').killed, false, '4 - update is processed and the flag is stored');
        });
        eventSourceInstance.emitMessage(notification2);
      }, MILLIS_FIRST_SPLIT_UPDATE_EVENT);

      setTimeout(() => {
        // Receive a SPLIT_KILL for flag
        client.once(client.Event.SDK_UPDATE, async () => {
          assert.equal(manager.split('workm').killed, true, '4 - update is processed and the flag is updated');
          await client.destroy();
          assert.end();
        });
        eventSourceInstance.emitMessage(notificationKill);
      }, MILLIS_SECOND_SPLIT_UPDATE_EVENT);

    });

    splitio = SplitFactory(configWithSets);
    client = splitio.client();
    manager = splitio.manager();

  }, 'SDK with sets configured updates flag when a SPLIT_KILL is received');

  t.test(async (assert) => {


    fetchMock.getOnce(baseUrls.sdk + '/splitChanges?s=1.3&since=1&rbSince=-1&sets=set_1,set_2',  function () {
      assert.pass('5 - A fetch is triggered due to the SPLIT_KILL');
      return { status: 200, body: { ff: { d: [], s: 1, t: 5 } }};
    });

    let splitio, client, manager = [];

    setMockListener((eventSourceInstance) => {
      eventSourceInstance.emitOpen();

      setTimeout(() => {
        assert.deepEqual(manager.splits(), [], '5 - initialized without flags');

        // Receive a SPLIT_KILL for flag that does not belongs to configured sets
        client.once(client.Event.SDK_UPDATE, async () => {
          assert.fail('5 - SDK_UPDATE should not be emitted for flags that are not in configured sets ');
        });
        eventSourceInstance.emitMessage(notificationKill);
      }, MILLIS_FIRST_SPLIT_UPDATE_EVENT);

      setTimeout(async () => {
        await client.destroy();
        assert.end();
      }, MILLIS_SECOND_SPLIT_UPDATE_EVENT);

    });

    splitio = SplitFactory(configWithSets);
    client = splitio.client();
    manager = splitio.manager();

  }, 'SDK with sets configured does not update flag when a SPLIT_KILL is received for a non-existing flag');

}
