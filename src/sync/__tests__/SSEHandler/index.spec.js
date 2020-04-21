import tape from 'tape';
import sinon from 'sinon';
import SSEHandlerFactory from '../../SSEHandler';
import { PUSH_CONNECT, SSE_ERROR } from '../../constants';

tape('SSEHandler', t => {

  const pushEmitter = {
    emit: sinon.stub()
  };
  const sseHandler = SSEHandlerFactory(pushEmitter);

  t.test('handleOpen (NotificationKeeper)', assert => {
    pushEmitter.emit.resetHistory();
    sseHandler.handleOpen();
    assert.true(pushEmitter.emit.calledOnceWithExactly(PUSH_CONNECT), 'must emit PUSH_CONNECT');

    assert.end();
  });

  t.test('handleError', assert => {
    pushEmitter.emit.resetHistory();

    const error = 'some error';
    sseHandler.handleError(error);
    assert.true(pushEmitter.emit.calledOnceWithExactly(SSE_ERROR, error), 'must emit SSE_ERROR with given error');

    const errorWithData = { data: '{ "message": "error message"}' };
    sseHandler.handleError(errorWithData);
    assert.true(pushEmitter.emit.calledWithExactly(SSE_ERROR,
      { data: errorWithData.data, parsedData: JSON.parse(errorWithData.data) }), 'must emit SSE_ERROR with given error and parsed data');

    const errorWithBadData = { data: '{"message"error"' };
    sseHandler.handleError(errorWithBadData);
    assert.true(pushEmitter.emit.calledWithExactly(SSE_ERROR,
      { data: errorWithBadData.data }), 'must emit SSE_ERROR with given error and not parsed data if cannot be parsed');

    assert.end();
  });

  t.test('handlerMessage (NotificationProcessor)', assert => {

    assert.end();
  });

});
