import tape from 'tape-catch';
import sinon from 'sinon';
import EventTracker from '../event';
import { STORAGE, INTEGRATIONS_MANAGER } from '../../utils/context/constants';

/* Mocks start */
const generateContextMocks = () => {
  // We are only mocking the pieces we care about
  const fakeStorage = {
    events: {
      track: sinon.stub()
    }
  };
  const fakeIntegrationsManager = {
    handleEvent: sinon.stub()
  };

  return {
    fakeStorage,
    fakeIntegrationsManager
  };
};

class ContextMock {
  constructor(fakeStorage, fakeIntegrationsManager) {
    this.constants = {
      STORAGE,
      INTEGRATIONS_MANAGER,
    };

    this.fakeStorage = fakeStorage;
    this.fakeIntegrationsManager = fakeIntegrationsManager;
  }

  get(target) {
    switch (target) {
      case STORAGE:
        return this.fakeStorage;
      case INTEGRATIONS_MANAGER:
        return this.fakeIntegrationsManager;
      default:
        break;
    }
  }
}
/* Mocks end */

tape('Event Tracker', t => {
  t.test('Tracker API', assert => {
    assert.equal(typeof EventTracker, 'function', 'The module should return a function which acts as a factory.');

    const { fakeStorage } = generateContextMocks();
    const contextMock = new ContextMock(fakeStorage);
    const instance = EventTracker(contextMock);

    assert.equal(typeof instance.track, 'function', 'The instance should implement the track method.');
    assert.end();
  });

  t.test('Propagate the event into the event cache and integrations manager, and return its result (boolean, or promise that resolves to boolean)', assert => {
    const { fakeStorage, fakeIntegrationsManager } = generateContextMocks();
    fakeStorage.events.track.withArgs('firstEvent', 1).returns(true);
    fakeStorage.events.track.withArgs('secondEvent', 2).returns(Promise.resolve(false));
    fakeStorage.events.track.withArgs('thirdEvent', 3).returns(Promise.resolve(true));
    const contextMock = new ContextMock(fakeStorage, fakeIntegrationsManager);

    const tracker = EventTracker(contextMock);

    const result1 = tracker.track('firstEvent', 1);

    assert.true(fakeStorage.events.track.calledWithMatch('firstEvent', 1), 'Should be present in the event cache.');
    assert.true(fakeIntegrationsManager.handleEvent.calledOnceWith('firstEvent'), 'Tracked event should be sent to integration manager.');
    assert.true(result1, true, 'Should return the value of the event cache.');

    const result2 = tracker.track('secondEvent', 2);

    assert.true(fakeStorage.events.track.calledWithMatch('secondEvent', 2), 'Should be present in the event cache.');
    result2.then(tracked => {
      assert.true(fakeIntegrationsManager.handleEvent.calledOnce, 'Untracked event should not be sent to integration manager.');
      assert.equal(tracked, false, 'Should return the value of the event cache resolved promise.');

      const result3 = tracker.track('thirdEvent', 3);

      assert.true(fakeStorage.events.track.calledWithMatch('thirdEvent', 3), 'Should be present in the event cache.');
      result3.then(tracked => {
        assert.true(fakeIntegrationsManager.handleEvent.calledTwice, 'Tracked event should be sent to integration manager.');
        assert.equal(tracked, true, 'Should return the value of the event cache resolved promise.');
      });
      assert.end();
    });
  });
});
