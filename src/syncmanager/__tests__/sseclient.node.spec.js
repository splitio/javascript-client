import tape from 'tape';
import sinon from 'sinon';
import EventSourceMock from './mocks/eventSourceMock';
import { authDataSample } from  './mocks/jwt';
import proxyquire from 'proxyquire';
const proxyquireStrict = proxyquire.noCallThru();

let eventSourceReference;

// Import the module, mocking getEventSource.
const SSClient = proxyquireStrict('../sseclient/index', {
  '../../services/sse/getEventSource': () => eventSourceReference
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

  t.test('setEventListener, open and close methods', assert => {
    // instance eventListener
    const listener = {
      handleOpen: sinon.stub(),
      handleClose: sinon.stub(),
      handleError: sinon.stub(),
      handleMessage: sinon.stub(),
    };

    // instance SSEClient
    eventSourceReference = EventSourceMock;
    const instance = SSClient.getInstance();
    instance.setEventListener(listener);

    // open connection
    instance.open(authDataSample);
    let esconnection = instance.connection; // instance of EventSource used to mock events
    esconnection.emitOpen();
    assert.ok(listener.handleOpen.calledOnce, 'handleOpen called when connection is opened');
    listener.handleOpen.resetHistory();

    // emit message
    const message = 'message';
    esconnection.emitMessage(message);
    assert.ok(listener.handleMessage.calledWith(message), 'handleMessage called when message received');
    listener.handleMessage.resetHistory();

    // emit error
    const error = 'error';
    esconnection.emitError(error);
    assert.ok(listener.handleError.calledWith(error), 'handleError called when error received');
    listener.handleError.resetHistory();

    // close connection
    instance.close();
    assert.ok(listener.handleClose.calledOnce, 'handleClose called when connection is closed');
    listener.handleClose.resetHistory();

    // open attempt without open event emitted
    instance.open(authDataSample);
    assert.ok(listener.handleOpen.notCalled, 'handleOpen not called until open event is emitted');

    // reopen connection
    instance.open(authDataSample);
    assert.ok(listener.handleClose.notCalled, 'handleClose not called when a new connection want to be open and previous one was not open');
    instance.connection.emitOpen();
    assert.ok(listener.handleOpen.calledOnce, 'handleOpen called when connection is open');
    instance.open(authDataSample);
    assert.ok(listener.handleClose.calledOnce, 'handleClose called when new connection want to be ope and previous one was open');

    assert.end();
  });

});