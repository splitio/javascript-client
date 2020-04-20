import tape from 'tape';
import sinon from 'sinon';
import SSEHandlerFactory from '../../SSEHandler';
import { PUSH_CONNECT } from '../../constants';

tape('SSEHandler', t => {

  const pushEmitter = {
    emit: sinon.stub()
  };
  const sseHandler = SSEHandlerFactory(pushEmitter);

  t.test('handleOpen (NotificationKeeper)', assert => {
    sseHandler.handleOpen();
    assert.true(pushEmitter.emit.calledOnceWithExactly(PUSH_CONNECT), '...');

    assert.end();
  });

  // t.test('handlerMessage (NotificationProcessor)', assert => {

  //   assert.end();
  // });

});
