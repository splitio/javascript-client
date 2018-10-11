/**
Copyright 2016 Split Software

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
**/
import tape from 'tape-catch';
import sinon from 'sinon';
import ImpressionsTracker from '../impressions';

/* Mocks start */
const generateContextMocks = () => {
  // We are only mocking the pieces we care about
  const fakeSettings = {
    runtime: { ip: 'fake-ip', hostname: 'fake-hostname' },
    version: 'js-test-10.4.0',
    impressionListener: {
      logImpression: sinon.stub()
    }
  };
  const fakeStorage = {
    impressions: {
      track: sinon.stub()
    }
  };

  return {
    fakeSettings, fakeStorage
  };
};

class ContextMock {
  constructor(fakeStorage, fakeSettings) {
    this.constants = {
      STORAGE: 'storage',
      SETTINGS: 'settings'
    };

    this.fakeStorage = fakeStorage;
    this.fakeSettings = fakeSettings;
  }

  get(target) {
    switch (target) {
      case 'storage':
        return this.fakeStorage;
      case 'settings':
        return this.fakeSettings;
      default:
        break;
    }
  }
}
/* Mocks end */

tape('PASS / transparently propagate the value into the collector', assert => {
  const { fakeStorage, fakeSettings } = generateContextMocks();
  const contextMock = new ContextMock(fakeStorage, fakeSettings);
  const passThrough = ImpressionsTracker(contextMock);

  passThrough(10);

  assert.true(fakeStorage.impressions.track.calledOnceWithExactly(10), 'ET should be present in the collector sequence');
  assert.end();
});

tape('PASS / transparently propagate the impression and attributes into a listener if provided', assert => {
  const fakeImpression = {
    fake: 'impression'
  };
  const fakeAttributes = {
    fake: 'attributes'
  };
  const { fakeStorage, fakeSettings } = generateContextMocks();
  const contextMock = new ContextMock(fakeStorage, fakeSettings);
  const passThrough = ImpressionsTracker(contextMock);

  passThrough(fakeImpression, fakeAttributes);

  assert.true(fakeStorage.impressions.track.calledOnceWithExactly(fakeImpression), 'Even with a listener, impression should be present in the collector sequence');
  assert.true(!fakeSettings.impressionListener.logImpression.calledOnce, 'The listener should not be executed synchronously');

  setTimeout(() => {
    assert.true(fakeSettings.impressionListener.logImpression.calledOnce, 'The listener should be executed after the timeout wrapping make it to the queue stack.');

    assert.deepEqual(fakeSettings.impressionListener.logImpression.getCall(0).args[0],
      { impression: fakeImpression, attributes: fakeAttributes, sdkLanguageVersion: fakeSettings.version, ...fakeSettings.runtime },
      'The listener should be executed with the corresponding map.');
    assert.end();
  }, 0);
});
