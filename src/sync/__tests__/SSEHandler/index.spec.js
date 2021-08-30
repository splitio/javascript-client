import tape from 'tape';
import sinon from 'sinon';
import SSEHandlerFactory from '../../SSEHandler';

// update messages
import splitUpdateMessage from '../../../__tests__/mocks/message.SPLIT_UPDATE.1457552620999';
import splitKillMessage from '../../../__tests__/mocks/message.SPLIT_KILL.1457552650000';
import segmentUpdateMessage from '../../../__tests__/mocks/message.SEGMENT_UPDATE.1457552640000';
import mySegmentsUpdateMessage from '../../../__tests__/mocks/message.MY_SEGMENTS_UPDATE.nicolas@split.io.1457552640000';

// update messages MY_SEGMENTS_UPDATE_V2
import unboundedMessage from '../../../__tests__/mocks/message.V2.UNBOUNDED.1457552650000';
import boundedGzipMessage from '../../../__tests__/mocks/message.V2.BOUNDED.GZIP.1457552651000';
import keylistGzipMessage from '../../../__tests__/mocks/message.V2.KEYLIST.GZIP.1457552652000';
import segmentRemovalMessage from '../../../__tests__/mocks/message.V2.SEGMENT_REMOVAL.1457552653000';
import { keylists, bitmaps } from '../mocks/dataMocks';

// occupancy messages
import occupancy1ControlPri from '../../../__tests__/mocks/message.OCCUPANCY.1.control_pri.1586987434450';
import occupancy0ControlPri from '../../../__tests__/mocks/message.OCCUPANCY.0.control_pri.1586987434550';
import occupancy2ControlPri from '../../../__tests__/mocks/message.OCCUPANCY.2.control_pri.1586987434650';
const occupancy1ControlSec = {...occupancy1ControlPri, data: occupancy1ControlPri.data.replace('control_pri', 'control_sec')};
const occupancy0ControlSec = {...occupancy0ControlPri, data: occupancy0ControlPri.data.replace('control_pri', 'control_sec')};
const occupancy2ControlSec = {...occupancy2ControlPri, data: occupancy2ControlPri.data.replace('control_pri', 'control_sec')};

// control messages
import controlStreamingPaused from '../../../__tests__/mocks/message.CONTROL.STREAMING_PAUSED.control_pri.1586987434750';
import controlStreamingResumed from '../../../__tests__/mocks/message.CONTROL.STREAMING_RESUMED.control_pri.1586987434850';
import controlStreamingDisabled from '../../../__tests__/mocks/message.CONTROL.STREAMING_DISABLED.control_pri.1586987434950';
const controlStreamingPausedSec = {...controlStreamingPaused, data: controlStreamingPaused.data.replace('control_pri', 'control_sec')};
const controlStreamingResumedSec = {...controlStreamingResumed, data: controlStreamingResumed.data.replace('control_pri', 'control_sec')};
const controlStreamingDisabledSec = {...controlStreamingDisabled, data: controlStreamingDisabled.data.replace('control_pri', 'control_sec')};

// streaming reset message, from `{orgHash}_{envHash}_control` channel
import streamingReset from '../../../__tests__/mocks/message.STREAMING_RESET';

import {
  PUSH_SUBSYSTEM_UP, PUSH_SUBSYSTEM_DOWN, PUSH_NONRETRYABLE_ERROR, PUSH_RETRYABLE_ERROR,
  SPLIT_UPDATE, SEGMENT_UPDATE, MY_SEGMENTS_UPDATE, SPLIT_KILL, MY_SEGMENTS_UPDATE_V2, STREAMING_RESET
} from '../../constants';

tape('SSEHandler', t => {

  const pushEmitter = {
    emit: sinon.stub()
  };

  t.test('`handleOpen` and `handlerMessage` for OCCUPANCY notifications (NotificationKeeper)', assert => {
    pushEmitter.emit.resetHistory();
    const sseHandler = SSEHandlerFactory(pushEmitter);

    // handleOpen

    sseHandler.handleOpen();
    assert.true(pushEmitter.emit.calledOnceWithExactly(PUSH_SUBSYSTEM_UP), 'must emit PUSH_SUBSYSTEM_UP');

    sseHandler.handleMessage({ data: '{ "data": "{\\"type\\":\\"SPLIT_UPDATE\\",\\"changeNumber\\":1457552620999 }" }' });
    assert.true(pushEmitter.emit.lastCall.calledWithExactly(SPLIT_UPDATE, 1457552620999), 'must handle update message if streaming on');

    // OCCUPANCY messages

    sseHandler.handleMessage(occupancy1ControlPri);
    assert.equal(pushEmitter.emit.callCount, 2, 'must not emit PUSH_SUBSYSTEM_UP if streaming on');

    sseHandler.handleMessage(occupancy0ControlPri);
    sseHandler.handleMessage(occupancy0ControlSec);
    assert.true(pushEmitter.emit.lastCall.calledWithExactly(PUSH_SUBSYSTEM_DOWN), 'must emit PUSH_SUBSYSTEM_DOWN if streaming on and OCCUPANCY 0 in both control channels');

    sseHandler.handleMessage({ data: '{ "data": "{\\"type\\":\\"SPLIT_UPDATE\\",\\"changeNumber\\":1457552620999 }" }' });
    assert.equal(pushEmitter.emit.callCount, 3, 'must not handle update message if streaming off after an OCCUPANCY message');

    sseHandler.handleMessage(streamingReset);
    assert.equal(pushEmitter.emit.callCount, 4, 'but must handle streaming reset message');

    sseHandler.handleMessage(occupancy0ControlPri);
    sseHandler.handleMessage(occupancy0ControlSec);
    assert.equal(pushEmitter.emit.callCount, 4, 'must not emit PUSH_SUBSYSTEM_DOWN if streaming off');

    sseHandler.handleMessage(occupancy1ControlPri);
    sseHandler.handleMessage(occupancy1ControlSec);
    assert.equal(pushEmitter.emit.callCount, 4, 'must ignore OCCUPANCY message if its timestamp is older');

    sseHandler.handleMessage(occupancy2ControlSec);
    assert.true(pushEmitter.emit.lastCall.calledWithExactly(PUSH_SUBSYSTEM_UP), 'must emit PUSH_SUBSYSTEM_UP if streaming off and OCCUPANCY mayor than 0 in at least one channel');

    sseHandler.handleMessage({ data: '{ "data": "{\\"type\\":\\"SPLIT_UPDATE\\",\\"changeNumber\\":1457552620999 }" }' });
    sseHandler.handleMessage(occupancy2ControlPri); // must not emit PUSH_SUBSYSTEM_UP, since streaming is already on

    assert.true(pushEmitter.emit.lastCall.calledWithExactly(SPLIT_UPDATE, 1457552620999), 'must handle update message if streaming on after an OCCUPANCY event');
    sseHandler.handleMessage(streamingReset);
    assert.true(pushEmitter.emit.lastCall.calledWithExactly(STREAMING_RESET), 'must handle streaming reset');
    assert.equal(pushEmitter.emit.callCount, 7, 'must not emit PUSH_SUBSYSTEM_UP if streaming is already on and another channel has publishers');

    assert.end();
  });

  t.test('`handlerMessage` for CONTROL notifications (NotificationKeeper)', assert => {
    pushEmitter.emit.resetHistory();
    const sseHandler = SSEHandlerFactory(pushEmitter);
    sseHandler.handleOpen();

    // CONTROL messages

    sseHandler.handleMessage(controlStreamingPaused);
    assert.true(pushEmitter.emit.lastCall.calledWithExactly(PUSH_SUBSYSTEM_DOWN), 'must emit PUSH_SUBSYSTEM_DOWN if streaming on and received a STREAMING_PAUSED control message');

    sseHandler.handleMessage({ data: '{ "data": "{\\"type\\":\\"SPLIT_UPDATE\\",\\"changeNumber\\":1457552620999 }" }' });
    assert.equal(pushEmitter.emit.callCount, 2, 'must not handle update message if streaming off after a CONTROL message');

    sseHandler.handleMessage(streamingReset);
    assert.equal(pushEmitter.emit.callCount, 3, 'but must handle streaming reset message');

    sseHandler.handleMessage(controlStreamingPaused);
    sseHandler.handleMessage(controlStreamingPausedSec);
    assert.equal(pushEmitter.emit.callCount, 3, 'must not emit PUSH_SUBSYSTEM_DOWN if streaming off');

    sseHandler.handleMessage(controlStreamingResumedSec); // testing STREAMING_RESUMED with second region
    assert.true(pushEmitter.emit.lastCall.calledWithExactly(PUSH_SUBSYSTEM_UP), 'must emit PUSH_SUBSYSTEM_UP if streaming off and received a STREAMING_RESUMED control message');

    sseHandler.handleMessage(controlStreamingResumed);
    sseHandler.handleMessage(controlStreamingResumedSec);
    assert.equal(pushEmitter.emit.callCount, 4, 'must not emit PUSH_SUBSYSTEM_UP if streaming on');

    sseHandler.handleMessage({ data: '{ "data": "{\\"type\\":\\"SPLIT_UPDATE\\",\\"changeNumber\\":1457552620999 }" }' });
    assert.true(pushEmitter.emit.lastCall.calledWithExactly(SPLIT_UPDATE, 1457552620999), 'must handle update message if streaming on after a CONTROL event');
    sseHandler.handleMessage(streamingReset);
    assert.true(pushEmitter.emit.lastCall.calledWithExactly(STREAMING_RESET), 'must handle streaming reset');

    sseHandler.handleMessage(controlStreamingDisabledSec); // testing STREAMING_DISABLED with second region
    assert.true(pushEmitter.emit.lastCall.calledWithExactly(PUSH_NONRETRYABLE_ERROR), 'must emit PUSH_NONRETRYABLE_ERROR if received a STREAMING_DISABLED control message');

    const sseHandler2 = SSEHandlerFactory(pushEmitter);
    sseHandler2.handleOpen();

    sseHandler2.handleMessage(controlStreamingPausedSec); // testing STREAMING_PAUSED with second region
    assert.true(pushEmitter.emit.lastCall.calledWithExactly(PUSH_SUBSYSTEM_DOWN));

    sseHandler2.handleMessage(controlStreamingDisabled);
    assert.true(pushEmitter.emit.lastCall.calledWithExactly(PUSH_NONRETRYABLE_ERROR), 'must emit PUSH_NONRETRYABLE_ERROR if received a STREAMING_DISABLED control message, even if streaming is off');

    assert.end();
  });

  t.test('`handlerMessage` for update notifications (NotificationProcessor) and streaming reset', assert => {
    const sseHandler = SSEHandlerFactory(pushEmitter);
    sseHandler.handleOpen();
    pushEmitter.emit.resetHistory();

    let expectedParams = [1457552620999];
    sseHandler.handleMessage(splitUpdateMessage);
    assert.true(pushEmitter.emit.lastCall.calledWithExactly(SPLIT_UPDATE, ...expectedParams), 'must emit SPLIT_UPDATE with the message change number');

    expectedParams = [1457552650000, 'whitelist', 'not_allowed'];
    sseHandler.handleMessage(splitKillMessage);
    assert.true(pushEmitter.emit.lastCall.calledWithExactly(SPLIT_KILL, ...expectedParams), 'must emit SPLIT_KILL with the message change number, split name and default treatment');

    expectedParams = [1457552640000, 'splitters'];
    sseHandler.handleMessage(segmentUpdateMessage);
    assert.true(pushEmitter.emit.lastCall.calledWithExactly(SEGMENT_UPDATE, ...expectedParams), 'must emit SEGMENT_UPDATE with the message change number and segment name');

    expectedParams = [{ type: 'MY_SEGMENTS_UPDATE', changeNumber: 1457552640000, includesPayload: false }, 'NzM2MDI5Mzc0_NDEzMjQ1MzA0Nw==_NTcwOTc3MDQx_mySegments'];
    sseHandler.handleMessage(mySegmentsUpdateMessage);
    assert.true(pushEmitter.emit.lastCall.calledWithExactly(MY_SEGMENTS_UPDATE, ...expectedParams), 'must emit MY_SEGMENTS_UPDATE with the message parsed data and channel');

    expectedParams = [{ type: 'MY_SEGMENTS_UPDATE_V2', changeNumber: 1457552650000, c: 0, d: '', u: 0, segmentName: '' }];
    sseHandler.handleMessage(unboundedMessage);
    assert.true(pushEmitter.emit.lastCall.calledWithExactly(MY_SEGMENTS_UPDATE_V2, ...expectedParams), 'must emit MY_SEGMENTS_UPDATE_V2 with the message parsed data');

    expectedParams = [{ type: 'MY_SEGMENTS_UPDATE_V2', changeNumber: 1457552651000, c: 1, d: bitmaps[0].bitmapDataCompressed, u: 1, segmentName: '' }];
    sseHandler.handleMessage(boundedGzipMessage);
    assert.true(pushEmitter.emit.lastCall.calledWithExactly(MY_SEGMENTS_UPDATE_V2, ...expectedParams), 'must emit MY_SEGMENTS_UPDATE_V2 with the message parsed data');

    expectedParams = [{ type: 'MY_SEGMENTS_UPDATE_V2', changeNumber: 1457552652000, c: 1, d: keylists[0].keyListDataCompressed, u: 2, segmentName: 'employees' }];
    sseHandler.handleMessage(keylistGzipMessage);
    assert.true(pushEmitter.emit.lastCall.calledWithExactly(MY_SEGMENTS_UPDATE_V2, ...expectedParams), 'must emit MY_SEGMENTS_UPDATE_V2 with the message parsed data');

    expectedParams = [{ type: 'MY_SEGMENTS_UPDATE_V2', changeNumber: 1457552653000, c: 0, d: '', u: 3, segmentName: 'employees' }];
    sseHandler.handleMessage(segmentRemovalMessage);
    assert.true(pushEmitter.emit.lastCall.calledWithExactly(MY_SEGMENTS_UPDATE_V2, ...expectedParams), 'must emit MY_SEGMENTS_UPDATE_V2 with the message parsed data');

    sseHandler.handleMessage(streamingReset);
    assert.true(pushEmitter.emit.lastCall.calledWithExactly(STREAMING_RESET), 'must emit STREAMING_RESET');

    assert.end();
  });

  t.test('handleError', assert => {
    const sseHandler = SSEHandlerFactory(pushEmitter);
    sseHandler.handleOpen();
    pushEmitter.emit.resetHistory();

    const error = 'some error';
    sseHandler.handleError(error);
    assert.true(pushEmitter.emit.lastCall.calledWithExactly(PUSH_RETRYABLE_ERROR), 'A network error must emit PUSH_RETRYABLE_ERROR');

    const errorWithData = { data: '{ "message": "error message"}' };
    sseHandler.handleError(errorWithData);
    assert.true(pushEmitter.emit.lastCall.calledWithExactly(PUSH_RETRYABLE_ERROR), 'An error without Ably code must emit PUSH_RETRYABLE_ERROR');

    const errorWithBadData = { data: '{"message"error"' };
    sseHandler.handleError(errorWithBadData);
    assert.true(pushEmitter.emit.lastCall.calledWithExactly(PUSH_RETRYABLE_ERROR), 'An error that cannot be parsed must emit PUSH_RETRYABLE_ERROR');

    const ably4XXRecoverableError = { data: '{"message":"Token expired","code":40142,"statusCode":401}' };
    sseHandler.handleError(ably4XXRecoverableError);
    assert.true(pushEmitter.emit.lastCall.calledWithExactly(PUSH_RETRYABLE_ERROR), 'An Ably recoverable error must emit PUSH_RETRYABLE_ERROR');

    const ably4XXNonRecoverableError = { data: '{"message":"Token expired","code":42910,"statusCode":429}' };
    sseHandler.handleError(ably4XXNonRecoverableError);
    assert.true(pushEmitter.emit.lastCall.calledWithExactly(PUSH_NONRETRYABLE_ERROR), 'An Ably non-recoverable error must emit PUSH_NONRETRYABLE_ERROR');

    const ably5XXError = { data: '{"message":"...","code":50000,"statusCode":500}' };
    sseHandler.handleError(ably5XXError);
    assert.true(pushEmitter.emit.lastCall.calledWithExactly(PUSH_RETRYABLE_ERROR), 'An Ably recoverable error must emit PUSH_RETRYABLE_ERROR');

    assert.end();
  });

  t.test('handlerMessage: ignore invalid events', assert => {
    const sseHandler = SSEHandlerFactory(pushEmitter);
    sseHandler.handleOpen();
    pushEmitter.emit.resetHistory();

    sseHandler.handleMessage('invalid message');
    sseHandler.handleMessage({ data: '{ data: %invalid json\'\'}' });
    assert.true(pushEmitter.emit.notCalled, 'must ignore massage if invalid');

    sseHandler.handleMessage({ data: '{ "data": "{\\"type\\":\\"UNSUPPORTED_TYPE\\",\\"changeNumber\\":1457552620999 }" }' });
    assert.true(pushEmitter.emit.notCalled, 'must ignore massage if it has an invalid type');

    sseHandler.handleMessage({ data: '{ "data": "{\\"type\\":\\"SPLIT_UPDATE\\",\\"changeNumber\\":1457552620999 }" }' });
    assert.true(pushEmitter.emit.calledOnce, 'must handle massage if valid');

    assert.end();
  });

});
