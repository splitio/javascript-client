import tape from 'tape';
import SplitToGa from '../SplitToGa';
import { SPLIT_IMPRESSION, SPLIT_EVENT } from '../../../utils/constants';
import { gaMock, gaRemove } from './gaMock';

const fakeImpressionPayload = {
  impression: {
    feature: 'hierarchical_splits_test',
    keyName: 'nicolas@split.io',
    treatment: 'on',
    bucketingKey: undefined,
    label: 'expected label'
  },
  attributes: undefined,
  ip: 'ip',
  hostname: 'hostname',
  sdkLanguageVersion: 'version',
};
const fakeImpression = {
  type: SPLIT_IMPRESSION,
  payload: fakeImpressionPayload,
};
const defaultImpressionFieldsObject = {
  hitType: 'event',
  eventCategory: 'split-impression',
  eventAction: 'Evaluate ' + fakeImpressionPayload.impression.feature,
  eventLabel: 'Treatment: ' + fakeImpressionPayload.impression.treatment + '. Targeting rule: ' + fakeImpressionPayload.impression.label + '.',
  nonInteraction: true
};

const fakeEventPayload = {
  eventTypeId: 'eventTypeId',
  trafficTypeName: 'trafficTypeName',
  value: 0,
  timestamp: Date.now(),
  key: 'key',
  properties: undefined,
};
const fakeEvent = {
  type: SPLIT_EVENT,
  payload: fakeEventPayload,
};
const defaultEventFieldsObject = {
  hitType: 'event',
  eventCategory: 'split-event',
  eventAction: fakeEventPayload.eventTypeId,
  eventValue: fakeEventPayload.value,
  nonInteraction: true
};

tape('SplitToGa', t => {

  t.test('SplitToGa.validateFieldsObject', assert => {
    assert.equal(SplitToGa.validateFieldsObject(undefined), false);
    assert.equal(SplitToGa.validateFieldsObject(null), false);
    assert.equal(SplitToGa.validateFieldsObject(123), false);
    assert.equal(SplitToGa.validateFieldsObject(true), false);
    assert.equal(SplitToGa.validateFieldsObject('something'), false);
    assert.equal(SplitToGa.validateFieldsObject(/asd/ig), false);
    assert.equal(SplitToGa.validateFieldsObject(function () { }), false);

    assert.equal(SplitToGa.validateFieldsObject({}), false, 'An empty object is an invalid FieldsObject instance');
    assert.equal(SplitToGa.validateFieldsObject({ hitType: 10 }), true, 'A fields object instance must have a HitType');
    assert.equal(SplitToGa.validateFieldsObject({ hitType: 'event', ignoredProp: 'ignoredProp' }), true, 'A fields object instance must have a HitType');

    assert.end();
  });

  t.test('SplitToGa.defaultMapper', assert => {
    assert.deepEqual(SplitToGa.defaultMapper(fakeImpression),
      defaultImpressionFieldsObject,
      'should return the corresponding FieldsObject for a given impression');
    assert.deepEqual(SplitToGa.defaultMapper(fakeEvent),
      defaultEventFieldsObject,
      'should return the corresponding FieldsObject for a given event');

    assert.end();
  });

  t.test('SplitToGa.getGa', assert => {

    const { ga } = gaMock();
    assert.equal(SplitToGa.getGa(), ga, 'should return ga command queue if it exists');

    gaRemove();
    assert.equal(SplitToGa.getGa(), undefined, 'should return undefined if ga command queue does not exist');

    assert.end();
  });

  t.test('SplitToGa (constructor and queue method)', assert => {

    // test setup
    const { ga } = gaMock();

    /** Default behaviour **/
    const instance = new SplitToGa();
    instance.queue(fakeImpression);
    assert.true(ga.lastCall.calledWithExactly('send', { ...defaultImpressionFieldsObject, splitHit: true }),
      'should queue `ga send` with the default mapped FieldsObject for impressions, appended with `splitHit` field');

    instance.queue(fakeEvent);
    assert.true(ga.lastCall.calledWithExactly('send', { ...defaultEventFieldsObject, splitHit: true }),
      'should queue `ga send` with the default mapped FieldsObject for events, appended with `splitHit` field');

    assert.equal(ga.callCount, 2);

    /** Custom behaviour **/
    // Custom filter
    function customFilter(data) {
      return data.type === SPLIT_EVENT;
    }
    // Custom mapper that returns a new FieldsObject instance
    function customMapper() {
      return {
        hitType: 'event',
        someField: 'someField',
      };
    }
    const trackerNames = ['', 'namedTracker'];
    const instance2 = new SplitToGa({
      filter: customFilter,
      mapper: customMapper,
      trackerNames,
    });
    ga.resetHistory();
    instance2.queue(fakeImpression);
    assert.true(ga.notCalled, 'shouldn\'t queue `ga send` if a Split data (impression or event) is filtered');

    instance2.queue(fakeEvent);
    assert.true(ga.calledWithExactly('send', { ...customMapper(fakeImpression, defaultImpressionFieldsObject), splitHit: true }),
      'should queue `ga send` with the custom trackerName and FieldsObject from customMapper, appended with `splitHit` field');
    assert.true(ga.calledWithExactly(`${trackerNames[1]}.send`, { ...customMapper(fakeEvent, defaultEventFieldsObject), splitHit: true }),
      'should queue `ga send` with the custom trackerName and FieldsObject from customMapper, appended with `splitHit` field');

    assert.equal(ga.callCount, 2);

    // Custom mapper that returns the default FieldsObject
    function customMapper2(data, defaultFieldsObject) {
      return defaultFieldsObject;
    }
    const instance3 = new SplitToGa({
      mapper: customMapper2,
    });
    ga.resetHistory();
    instance3.queue(fakeImpression);
    assert.true(ga.lastCall.calledWithExactly('send', { ...customMapper2(fakeImpression, defaultImpressionFieldsObject), splitHit: true }),
      'should queue `ga send` with the custom FieldsObject from customMapper2, appended with `splitHit` field');

    assert.equal(ga.callCount, 1);

    // Custom mapper that throws an error
    function customMapper3() {
      throw 'some error';
    }
    const instance4 = new SplitToGa({
      mapper: customMapper3,
    });
    ga.resetHistory();
    instance4.queue(fakeImpression);
    assert.true(ga.notCalled, 'shouldn\'t queue `ga send` if a custom mapper throw an exception');

    // `impressions` flags
    const instance5 = new SplitToGa({
      impressions: false,
    });
    ga.resetHistory();
    instance5.queue(fakeImpression);
    assert.true(ga.notCalled, 'shouldn\'t queue `ga send` for an impression if `impressions` flag is false');

    // `impressions` flags
    const instance6 = new SplitToGa({
      events: false,
    });
    ga.resetHistory();
    instance6.queue(fakeEvent);
    assert.true(ga.notCalled, 'shouldn\'t queue `ga send` for a event if `events` flag is false');

    // test teardown
    gaRemove();
    assert.end();
  });
});
