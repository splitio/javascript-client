import tape from 'tape-catch';
import sinon from 'sinon';
import EventTracker from '../event';

/* Mocks start */
const generateContextMocks = () => {
  // We are only mocking the pieces we care about
  const fakeStorage = {
    events: {
      track: sinon.stub()
    }
  };

  return {
    fakeStorage
  };
};

class ContextMock {
  constructor(fakeStorage) {
    this.constants = {
      STORAGE: 'storage',
    };

    this.fakeStorage = fakeStorage;
  }

  get(target) {
    switch (target) {
      case 'storage':
        return this.fakeStorage;
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

  t.test('Propagate the value into the event cache, and return its result (boolean, or promise that resolves to boolean)', assert => {
    const { fakeStorage } = generateContextMocks();
    fakeStorage.events.track.withArgs('firstEvent', 1).returns(true);
    fakeStorage.events.track.withArgs('secondEvent', 2).returns(Promise.resolve(false));
    const contextMock = new ContextMock(fakeStorage);
    const tracker = EventTracker(contextMock);

    const result1 = tracker.track('firstEvent', 1);

    assert.true(fakeStorage.events.track.calledWithMatch('firstEvent', 1), 'Should be present in the event cache.');
    assert.true(result1, true, 'Should return the value of the event cache.');

    const result2 = tracker.track('secondEvent', 2);

    assert.true(fakeStorage.events.track.calledWithMatch('secondEvent', 2), 'Should be present in the event cache.');
    result2.then(tracked => {
      assert.equal(tracked, false, 'Should return the value of the event cache resolved promise.');
    });
    assert.end();
  });
});
