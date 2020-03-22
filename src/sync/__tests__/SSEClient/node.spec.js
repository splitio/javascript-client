import tape from 'tape';
import sinon from 'sinon';
import proxyquire from 'proxyquire';
import EventSourceMock from '../mocks/eventSourceMock';
import { authDataSample } from  '../mocks/dataMocks';
const proxyquireStrict = proxyquire.noCallThru();

let eventSourceReference;

// Import the module, mocking getEventSource.
const SSClient = proxyquireStrict('../../sseclient/index', {
  '../../services/getEventSource': () => eventSourceReference
}).default;

tape('SSClient', t => {

  t.test('getInstance', assert => {
    eventSourceReference = undefined;
    let instance = SSClient.getInstance();
    assert.equal(instance, undefined, 'instance not created if EventSource not available');

    eventSourceReference = EventSourceMock;
    instance = SSClient.getInstance();
    assert.notEqual(instance, undefined, 'instance created if EventSource is available');
    assert.notEqual(instance.eventSource, EventSourceMock, 'the instance EventSource');

    assert.end();
  });

  t.test('setEventHandler, open and close methods', assert => {
    // instance event handler
    const handler = {
      handleOpen: sinon.stub(),
      handleClose: sinon.stub(),
      handleError: sinon.stub(),
      handleMessage: sinon.stub(),
    };

    // instance SSEClient
    eventSourceReference = EventSourceMock;
    const instance = SSClient.getInstance();
    instance.setEventHandler(handler);

    // open connection
    instance.open(authDataSample);
    let esconnection = instance.connection; // instance of EventSource used to mock events
    esconnection.emitOpen();
    assert.ok(handler.handleOpen.calledOnce, 'handleOpen called when connection is opened');
    handler.handleOpen.resetHistory();

    // emit message
    const message = 'message';
    esconnection.emitMessage(message);
    assert.ok(handler.handleMessage.calledWith(message), 'handleMessage called when message received');
    handler.handleMessage.resetHistory();

    // emit error
    const error = 'error';
    esconnection.emitError(error);
    assert.ok(handler.handleError.calledWith(error), 'handleError called when error received');
    handler.handleError.resetHistory();

    // close connection
    instance.close();
    assert.ok(handler.handleClose.calledOnce, 'handleClose called when connection is closed');
    handler.handleClose.resetHistory();

    // open attempt without open event emitted
    instance.open(authDataSample);
    assert.ok(handler.handleOpen.notCalled, 'handleOpen not called until open event is emitted');

    // reopen connection
    instance.open(authDataSample);
    assert.ok(handler.handleClose.notCalled, 'handleClose not called when a new connection want to be open and previous one was not open');
    instance.connection.emitOpen();
    assert.ok(handler.handleOpen.calledOnce, 'handleOpen called when connection is open');
    instance.open(authDataSample);
    assert.ok(handler.handleClose.calledOnce, 'handleClose called when connection is closed to open a new connection');

    // remove event handler before opening a new connection
    handler.handleOpen.resetHistory();
    instance.setEventHandler(undefined);
    instance.open(authDataSample);
    instance.connection.emitOpen();
    assert.ok(handler.handleOpen.notCalled, 'handleOpen not called if connection is open but the handler was removed');

    assert.end();
  });

});