/**
 * Unit tests:
 *  DONE- SplitToGa.validateFieldsObject
 *  DONE- SplitToGa.defaultFilter
 *  DONE- SplitToGa.defaultMapper
 *  DONE- SplitToGa.getGa
 *  DONE- SplitToGa.prototype.constructor
 *  DONE- SplitToGa.prototype.queue
 */

import tape from 'tape';
import SplitToGa from '../SplitToGa';
import { SPLIT_IMPRESSION, SPLIT_EVENT } from '../../../../lib/utils/constants';
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
const fakeImpressionFieldsObject = {
  hitType: 'event',
  eventCategory: 'split-impression',
  eventAction: fakeImpressionPayload.impression.feature,
  eventLabel: fakeImpressionPayload.impression.treatment,
  nonInteraction: true,
};

const fakeEventPayload = {
  eventTypeId: 'eventTypeId',
  trafficTypeName: 'trafficTypeName',
  value: 0,
  timestamp: Date.now(),
  key: 'key',
  properties: undefined,
};
const fakeEventFieldsObject = {
  hitType: 'event',
  eventCategory: 'split-event',
  eventAction: fakeEventPayload.eventTypeId,
  eventValue: fakeEventPayload.value,
  nonInteraction: true,
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
    assert.equal(SplitToGa.validateFieldsObject({ hitType: 10 }), false, 'HitType must not be other than a string object');
    assert.equal(SplitToGa.validateFieldsObject({ hitType: 'event' }), true, 'HitType must be a string object');

    assert.end();
  });

  t.test('SplitToGa.defaultFilter', assert => {
    assert.equal(SplitToGa.defaultFilter({ payload: fakeImpressionPayload, type: SPLIT_IMPRESSION }), true, 'should return true for any impression');
    assert.equal(SplitToGa.defaultFilter({ payload: fakeEventPayload, type: SPLIT_EVENT }), true, 'should return true for any event');

    assert.end();
  });

  t.test('SplitToGa.defaultMapper', assert => {
    assert.deepEqual(SplitToGa.defaultMapper({ payload: fakeImpressionPayload, type: SPLIT_IMPRESSION }),
      fakeImpressionFieldsObject,
      'should return the corresponding FieldsObject for a given impression');
    assert.deepEqual(SplitToGa.defaultMapper({ payload: fakeEventPayload, type: SPLIT_EVENT }),
      fakeEventFieldsObject,
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

    const { ga } = gaMock();

    /** Default behaviour **/
    const instance = new SplitToGa();
    instance.queue({ payload: fakeImpressionPayload, type: SPLIT_IMPRESSION });
    assert.true(ga.lastCall.calledWithExactly('send', SplitToGa.defaultMapper({ payload: fakeImpressionPayload, type: SPLIT_IMPRESSION })),
      'should queue `ga send` with the default mapped FieldsObject for impressions');

    instance.queue({ payload: fakeEventPayload, type: SPLIT_EVENT });
    assert.true(ga.lastCall.calledWithExactly('send', SplitToGa.defaultMapper({ payload: fakeEventPayload, type: SPLIT_EVENT })),
      'should queue `ga send` with the default mapped FieldsObject for events');

    /** Custom behaviour **/
    // Custom filter
    function customFilter(data) {
      return data.type === SPLIT_EVENT;
    }
    // Custom mapper
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
    instance2.queue({ payload: fakeImpressionPayload, type: SPLIT_IMPRESSION });
    assert.true(ga.notCalled, 'shouldn\'t queue `ga send` if a Split data (impression or event) is filtered');

    instance2.queue({ payload: fakeEventPayload, type: SPLIT_EVENT });
    assert.true(ga.calledWithExactly('send', customMapper({ payload: fakeEventPayload, type: SPLIT_EVENT })),
      'should queue `ga send` with the custom trackerName and FieldsObject from customMapper');
    assert.true(ga.calledWithExactly(`${trackerNames[1]}.send`, customMapper({ payload: fakeEventPayload, type: SPLIT_EVENT })),
      'should queue `ga send` with the custom trackerName and FieldsObject from customMapper');

    gaRemove();
    assert.end();
  });
});
