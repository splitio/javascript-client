import tape from 'tape';
import sinon from 'sinon';
import proxyquire from 'proxyquire';
import SettingsFactory from '../../../utils/settings';
import EventSourceMock from '../mocks/eventSourceMock';
import { authDataSample, channelsQueryParamSample } from '../mocks/dataMocks';
const proxyquireStrict = proxyquire.noCallThru();

let eventSourceReference;

// Import the module, mocking getEventSource.
const SSClient = proxyquireStrict('../../SSEClient/index', {
  '../../services/getEventSource': () => eventSourceReference
}).default;

const settings = SettingsFactory({
  core: {
    key: 'emi@split.io'
  }
});

tape('SSClient', t => {

  t.test('getInstance', assert => {
    eventSourceReference = undefined;
    let instance = SSClient.getInstance(settings);
    assert.equal(instance, undefined, 'instance not created if EventSource not available');

    eventSourceReference = EventSourceMock;
    instance = SSClient.getInstance(settings);
    assert.notEqual(instance, undefined, 'instance created if EventSource is available');
    assert.notEqual(instance.eventSource, EventSourceMock, 'the instance EventSource');

    assert.end();
  });

  t.test('setEventHandler, open and close methods', assert => {
    // instance event handler
    const handler = {
      handleOpen: sinon.stub(),
      handleError: sinon.stub(),
      handleMessage: sinon.stub(),
    };

    // instance SSEClient
    eventSourceReference = EventSourceMock;
    const instance = SSClient.getInstance(settings);
    instance.setEventHandler(handler);

    // error on first open without authToken
    assert.throws(instance.reopen, 'throw error if reopen is invoked without a previous open call');

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
    assert.equal(instance.connection.readyState, 2, 'connection readyState is CLOSED'); // CLOSED (2)

    // open attempt without open event emitted
    instance.open(authDataSample);
    assert.ok(handler.handleOpen.notCalled, 'handleOpen not called until open event is emitted');

    // open a new connection
    instance.open(authDataSample);
    instance.connection.emitOpen();
    assert.ok(handler.handleOpen.calledOnce, 'handleOpen called when connection is open');

    // reopen the connection
    handler.handleOpen.resetHistory();
    instance.reopen();
    instance.connection.emitOpen();
    assert.ok(handler.handleOpen.calledOnce, 'handleOpen called if connection is reopen');

    // remove event handler before opening a new connection
    handler.handleOpen.resetHistory();
    instance.setEventHandler(undefined);
    instance.open(authDataSample);
    instance.connection.emitOpen();
    assert.ok(handler.handleOpen.notCalled, 'handleOpen not called if connection is open but the handler was removed');

    assert.end();
  });

  t.test('open method: URL', assert => {

    eventSourceReference = EventSourceMock;
    const instance = SSClient.getInstance(settings);
    instance.open(authDataSample);

    const EXPECTED_URL = settings.url('/sse') +
      '?channels=' + channelsQueryParamSample +
      '&accessToken=' + authDataSample.token +
      '&v=1.1&heartbeats=true';

    assert.equal(instance.connection.url, EXPECTED_URL, 'URL is properly set for streaming connection');

    assert.end();
  });

});