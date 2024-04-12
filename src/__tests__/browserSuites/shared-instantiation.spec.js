import { SplitFactory } from '../../';
import { settingsFactory } from '../../settings';
import { url } from '../testUtils';

const settings = settingsFactory({
  core: {
    key: 'asd'
  },
  streamingEnabled: false
});

/**
 * @param {boolean} startWithTT whether the SDK settings includes a `core.trafficType` config param or not
 * @param {boolean} sdkIgnoredTT whether the SDK ignores TT (i.e, clients without bound TT) or not (client with optional bound TT)
 */
export default function sharedInstantiationSuite(startWithTT, sdkIgnoresTT, fetchMock, assert) {
  // mocking mySegments endpoints with delays for new clients
  fetchMock.get(url(settings, '/mySegments/emiliano%2Fsplit.io'), { status: 200, body: { mySegments: [] } }, { delay: 100 });
  fetchMock.get(url(settings, '/mySegments/matias%25split.io'), { status: 200, body: { mySegments: [] } }, { delay: 200 });

  const factory = SplitFactory({
    core: {
      authorizationKey: 'dummy',
      key: 'facundo@split.io',
      trafficType: startWithTT ? 'start_tt' : undefined
    },
    startup: {
      eventsFirstPushWindow: 3,
      readyTimeout: 0.15
    },
    streamingEnabled: false
  });
  let mainClient = factory.client();
  assert.equal(mainClient, factory.client(), 'If we call factory.client() (no params) more than once, it is just a get of the main client.');
  assert.equal(mainClient, factory.client('facundo@split.io', startWithTT ? 'start_tt' : undefined), 'If we call factory.client() with params matching what was passed on the configuration, it is just a get of the main client still.');

  let nicolasClient = factory.client('nicolas@split.io', 'nico_tt');
  let marcioClient = factory.client('marcio@split.io');
  let emilianoClient = factory.client('emiliano/split.io');
  let matiasClient = factory.client('matias%split.io');
  let emmanuelClient = factory.client('emmanuel@split.io');

  assert.throws(factory.client.bind(factory, null), 'Calling factory.client() with a key parameter that is not a valid key should throw.');
  assert.throws(factory.client.bind(factory, {}), 'Calling factory.client() with a key parameter that is not a valid key should throw.');
  if (sdkIgnoresTT) { // JS Browser SDK
    assert.doesNotThrow(factory.client.bind(factory, 'facundo@split.io', null), 'Calling factory.client() with a traffic type parameter that is not valid shouldn\'t throw because it is ignored.');
    assert.doesNotThrow(factory.client.bind(factory, 'facundo@split.io', []), 'Calling factory.client() with a traffic type parameter that is not valid shouldn\'t throw because it is ignored.');
  } else { // JS SDK (Isomorphic)
    assert.throws(factory.client.bind(factory, 'facundo@split.io', null), 'Calling factory.client() with a traffic type parameter that is not a valid should throw.');
    assert.throws(factory.client.bind(factory, 'facundo@split.io', []), 'Calling factory.client() with a traffic type parameter that is not a valid should throw.');
  }

  // Used for wrapping up test when we should
  const finished = (function* f() {
    yield;
    yield;
    yield;
    yield;
    yield;
    yield;
    yield;
    yield;
    yield;
    yield;
    yield;
    yield;
    yield;

    marcioClient.destroy();
    nicolasClient.destroy();
    mainClient.destroy();
    emilianoClient.destroy();
    matiasClient.destroy();
    emmanuelClient.destroy();

    assert.end();
  })();
  /**
   * Assertion suite for client.getTreatment() & client.getTreatments()
   */
  const getTreatmentsAssertions = async (client, expect) => {
    assert.equal(await client.getTreatment('always_off'), expect[0], 'Shared client evaluations should be correct.');
    assert.equal(await client.getTreatment('always_on'), expect[1], 'Shared client evaluations should be correct.');
    assert.equal(await client.getTreatment('splitters'), expect[2], 'Shared client evaluations should be correct.');
    assert.equal(await client.getTreatment('developers'), expect[3], 'Shared client evaluations should be correct.');
    assert.equal(await client.getTreatment('not_exists'), 'control', 'Shared client evaluations should be correct.');

    assert.deepEqual(await client.getTreatments([
      'always_off', 'always_on', 'splitters', 'developers', 'not_exists'
    ]), {
      'always_off': expect[0],
      'always_on': expect[1],
      'splitters': expect[2],
      'developers': expect[3],
      'not_exists': 'control'
    }, 'Shared client evaluations should be correct.');

    finished.next();
  };

  /**
   * Assertion suite for client.track()
   */
  const trackAssertions = () => {
    // Prepare the mock to check for events having correct values
    fetchMock.postOnce(url(settings, '/events/bulk'), (url, opts) => {
      const events = JSON.parse(opts.body);

      assert.equal(events.length, sdkIgnoresTT ? 2 : 3, 'Tracked only valid events');
      assert.equal(events[0].trafficTypeName, `${startWithTT && !sdkIgnoresTT ? 'start' : 'main'}_tt`, 'matching traffic type provided through client.track()');
      assert.equal(events[1].trafficTypeName, 'marcio_tt', 'matching traffic type provided through client.track()');
      if (!sdkIgnoresTT) assert.equal(events[2].trafficTypeName, 'nico_tt', 'matching traffic type provided through client.track()');

      finished.next();

      return 200;
    });

    if (startWithTT && !sdkIgnoresTT) {
      assert.true(mainClient.track('myEvent', 10), 'If we specified the TT via settings, we should be able to track events without passing it as param');
    } else {
      assert.false(mainClient.track('myEvent'), 'If we have not specified TT via settings, it should be required on client.track()');
      assert.true(mainClient.track('main_tt', 'myEvent', 10), 'If we have not specified TT via settings, it should be required on client.track()');
    }

    // Shared instance without TT on instantiation
    assert.false(marcioClient.track('marcioEvent'), 'If a shared client was created passing only key, no traffic type is bound so we need to provide one for client.track()');
    assert.true(marcioClient.track('marcio_tt', 'marcioEvent', 10), 'If a shared client was created passing only key, no traffic type is bound so we need to provide one for client.track()');

    // Shared instance with TT on instantiation
    if (sdkIgnoresTT) {
      assert.false(nicolasClient.track('nicoEvent', 10), 'If a shared client was created passing both key and TT but the SDK ignores TT, the latter doesn\'t get bound to it so it is necessary to provide the traffic type to client.track()');
    } else {
      assert.true(nicolasClient.track('nicoEvent', 10), 'If a shared client was created passing both key and TT, the latter gets bound to it so it is not necessary to provide the traffic type to client.track()');
    }
  };

  /* Assert initial state */
  assert.notEqual(mainClient.ready, nicolasClient.ready, 'Shared clients should have their own ready promise.');
  assert.notEqual(mainClient.ready, marcioClient.ready, 'Shared clients should have their own ready promise.');
  assert.notEqual(nicolasClient.ready, marcioClient.ready, 'Shared clients should have their own ready promise.');

  /* Assert client.track(), no need to wait for ready. */
  trackAssertions();

  /* Assert getTreatment/s */
  const expectControls = ['control', 'control', 'control', 'control'];
  // If main is not ready and returning controls, they all return controls.
  getTreatmentsAssertions(mainClient, expectControls);
  getTreatmentsAssertions(nicolasClient, expectControls);
  getTreatmentsAssertions(marcioClient, expectControls);
  getTreatmentsAssertions(emilianoClient, expectControls);
  getTreatmentsAssertions(emmanuelClient, expectControls);

  emmanuelClient.setAttribute('attr', 10);
  nicolasClient.setAttributes({ attr: 9 });

  // Each client is ready when splits and its segments are fetched
  mainClient.ready().then(() => {
    assert.comment('Main instance - facundo@split.io');
    getTreatmentsAssertions(mainClient, ['off', 'on', 'on', 'off']);
    getTreatmentsAssertions(emilianoClient, expectControls);

    emilianoClient.ready().then(() => {
      assert.comment('Shared instance - emiliano/split.io');
      getTreatmentsAssertions(emilianoClient, ['off', 'on', 'off', 'off']);
    });
  });

  nicolasClient.ready().then(() => {
    assert.comment('Shared instance - nicolas@split.io');
    getTreatmentsAssertions(nicolasClient, ['off', 'on', 'off', 'on']);
    assert.equal(nicolasClient.getTreatment('user_attr_gte_10'), 'off');
  });
  marcioClient.ready().then(() => {
    assert.comment('Shared instance - marcio@split.io');
    getTreatmentsAssertions(marcioClient, ['off', 'on', 'off', 'off']);
    assert.equal(marcioClient.getTreatment('user_attr_gte_10'), 'off');
  });
  matiasClient.on(matiasClient.Event.SDK_READY_TIMED_OUT, () => {
    getTreatmentsAssertions(matiasClient, expectControls);
  });
  matiasClient.ready().catch(() => {
    matiasClient.on(matiasClient.Event.SDK_READY, () => {
      getTreatmentsAssertions(matiasClient, ['off', 'on', 'off', 'off']);
      matiasClient.ready().then(() => {
        assert.comment('Shared instance - matias%split.io');
        getTreatmentsAssertions(matiasClient, ['off', 'on', 'off', 'off']);
        assert.equal(matiasClient.getTreatment('user_attr_gte_10'), 'off');
      });
    });
    assert.comment('Shared instance - matias%split.io');
    getTreatmentsAssertions(matiasClient, expectControls);
  });
  emmanuelClient.ready().then(() => {
    assert.comment('Shared instance - emmanuel@split.io');
    assert.equal(emmanuelClient.getTreatment('user_attr_gte_10'), 'on');
  });
}
