import tape from 'tape';
import sinon from 'sinon';
import SSEHandlerFactory from '../../SSEHandler';

// update messages
import splitUpdateMessage from '../../../__tests__/mocks/message.SPLIT_UPDATE.1457552620999';
import splitKillMessage from '../../../__tests__/mocks/message.SPLIT_KILL.1457552650000';
import segmentUpdateMessage from '../../../__tests__/mocks/message.SEGMENT_UPDATE.1457552640000';
import mySegmentsUpdateMessage from '../../../__tests__/mocks/message.MY_SEGMENTS_UPDATE.nicolas@split.io.1457552640000';

// occupancy messages
import occupancy1ControlPri from '../../../__tests__/mocks/message.OCCUPANCY.1.control_pri.1586987434450';
import occupancy0ControlPri from '../../../__tests__/mocks/message.OCCUPANCY.0.control_pri.1586987434550';
import occupancy2ControlPri from '../../../__tests__/mocks/message.OCCUPANCY.2.control_pri.1586987434650';

// control messages
import controlStreamingPaused from '../../../__tests__/mocks/message.CONTROL.STREAMING_PAUSED.control_pri.1586987434750';
import controlStreamingResumed from '../../../__tests__/mocks/message.CONTROL.STREAMING_RESUMED.control_pri.1586987434850';
import controlStreamingDisabled from '../../../__tests__/mocks/message.CONTROL.STREAMING_DISABLED.control_pri.1586987434950';

import {
  PUSH_SUBSYSTEM_UP, PUSH_SUBSYSTEM_DOWN, PUSH_DISABLED, SSE_ERROR,
  SPLIT_UPDATE, SEGMENT_UPDATE, MY_SEGMENTS_UPDATE, SPLIT_KILL
} from '../../constants';

tape('SSEHandler', t => {

  const pushEmitter = {
    emit: sinon.stub()
  };

  t.test('`handleOpen` and `handlerMessage` for CONTROL and OCCUPANCY notifications (NotificationKeeper)', assert => {
    pushEmitter.emit.resetHistory();
    const sseHandler = SSEHandlerFactory(pushEmitter);

    // handleOpen

    sseHandler.handleOpen();
    assert.true(pushEmitter.emit.calledOnceWithExactly(PUSH_SUBSYSTEM_UP), 'must emit PUSH_SUBSYSTEM_UP');

    sseHandler.handleMessage({ data: '{ "data": "{\\"type\\":\\"SPLIT_UPDATE\\",\\"changeNumber\\":1457552620999 }" }' });
    assert.true(pushEmitter.emit.lastCall.calledWithExactly(SPLIT_UPDATE, 1457552620999), 'must handle update massage if streaming on');

    // OCCUPANCY messages

    sseHandler.handleMessage(occupancy1ControlPri);
    assert.equal(pushEmitter.emit.callCount, 2, 'must not emit PUSH_SUBSYSTEM_UP if streaming on');

    sseHandler.handleMessage(occupancy0ControlPri);
    assert.true(pushEmitter.emit.lastCall.calledWithExactly(PUSH_SUBSYSTEM_DOWN), 'must emit PUSH_SUBSYSTEM_DOWN if streaming on and OCCUPANCY 0 in control_pri');

    sseHandler.handleMessage({ data: '{ "data": "{\\"type\\":\\"SPLIT_UPDATE\\",\\"changeNumber\\":1457552620999 }" }' });
    assert.true(pushEmitter.emit.callCount, 3, 'must not handle update massage if streaming off after an OCCUPANCY message');

    sseHandler.handleMessage(occupancy0ControlPri);
    assert.equal(pushEmitter.emit.callCount, 3, 'must not emit PUSH_SUBSYSTEM_DOWN if streaming off');

    sseHandler.handleMessage(occupancy1ControlPri);
    assert.true(pushEmitter.emit.callCount, 3, 'must ignore OCCUPANCY message if its timestamp is older');

    sseHandler.handleMessage(occupancy2ControlPri);
    assert.true(pushEmitter.emit.lastCall.calledWithExactly(PUSH_SUBSYSTEM_UP), 'must emit PUSH_SUBSYSTEM_UP if streaming off and OCCUPANCY mayor than 0 in control_pri');

    sseHandler.handleMessage({ data: '{ "data": "{\\"type\\":\\"SPLIT_UPDATE\\",\\"changeNumber\\":1457552620999 }" }' });
    assert.true(pushEmitter.emit.lastCall.calledWithExactly(SPLIT_UPDATE, 1457552620999), 'must handle update massage if streaming on after an OCCUPANCY event');

    // CONTROL messages

    sseHandler.handleMessage(controlStreamingPaused);
    assert.true(pushEmitter.emit.lastCall.calledWithExactly(PUSH_SUBSYSTEM_DOWN), 'must emit PUSH_SUBSYSTEM_DOWN if streaming on and received a STREAMING_PAUSED control message');

    sseHandler.handleMessage({ data: '{ "data": "{\\"type\\":\\"SPLIT_UPDATE\\",\\"changeNumber\\":1457552620999 }" }' });
    assert.true(pushEmitter.emit.callCount, 6, 'must not handle update massage if streaming off after a CONTROL message');

    sseHandler.handleMessage(controlStreamingPaused);
    assert.true(pushEmitter.emit.callCount, 6, 'must not emit PUSH_SUBSYSTEM_DOWN if streaming off');

    sseHandler.handleMessage(controlStreamingResumed);
    assert.true(pushEmitter.emit.lastCall.calledWithExactly(PUSH_SUBSYSTEM_UP), 'must emit PUSH_SUBSYSTEM_UP if streaming off and received a STREAMING_RESUMED control message');

    sseHandler.handleMessage(controlStreamingResumed);
    assert.equal(pushEmitter.emit.callCount, 7, 'must not emit PUSH_SUBSYSTEM_UP if streaming on');

    sseHandler.handleMessage({ data: '{ "data": "{\\"type\\":\\"SPLIT_UPDATE\\",\\"changeNumber\\":1457552620999 }" }' });
    assert.true(pushEmitter.emit.lastCall.calledWithExactly(SPLIT_UPDATE, 1457552620999), 'must handle update massage if streaming on after a CONTROL event');

    sseHandler.handleMessage(controlStreamingDisabled);
    assert.true(pushEmitter.emit.lastCall.calledWithExactly(PUSH_DISABLED), 'must emit PUSH_DISABLED if received a STREAMING_RESUMED control message');

    const sseHandler2 = SSEHandlerFactory(pushEmitter);
    sseHandler2.handleOpen();

    sseHandler2.handleMessage(controlStreamingPaused);
    assert.true(pushEmitter.emit.lastCall.calledWithExactly(PUSH_SUBSYSTEM_DOWN));

    sseHandler2.handleMessage(controlStreamingDisabled);
    assert.true(pushEmitter.emit.lastCall.calledWithExactly(PUSH_DISABLED), 'must emit PUSH_DISABLED if received a STREAMING_RESUMED control message, even if streaming is off');

    assert.end();
  });

  t.test('`handlerMessage` for update notifications (NotificationProcessor)', assert => {
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

    assert.end();
  });

  t.test('handleError', assert => {
    const sseHandler = SSEHandlerFactory(pushEmitter);
    sseHandler.handleOpen();
    pushEmitter.emit.resetHistory();

    const error = 'some error';
    sseHandler.handleError(error);
    assert.true(pushEmitter.emit.lastCall.calledWithExactly(SSE_ERROR, error), 'must emit SSE_ERROR with given error');

    const errorWithData = { data: '{ "message": "error message"}' };
    sseHandler.handleError(errorWithData);
    assert.true(pushEmitter.emit.lastCall.calledWithExactly(SSE_ERROR,
      { data: errorWithData.data, parsedData: JSON.parse(errorWithData.data) }), 'must emit SSE_ERROR with given error and parsed data');

    const errorWithBadData = { data: '{"message"error"' };
    sseHandler.handleError(errorWithBadData);
    assert.true(pushEmitter.emit.lastCall.calledWithExactly(SSE_ERROR,
      { data: errorWithBadData.data }), 'must emit SSE_ERROR with given error and not parsed data if cannot be parsed');

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
