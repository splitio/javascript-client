import proxyquire from 'proxyquire';
import tape from 'tape-catch';
import sinon from 'sinon';
import forEach from 'lodash/forEach';
import merge from 'lodash/merge';
import reduce from 'lodash/reduce';
import { _Set, setToArray } from '../../../utils/lang/Sets';

// The list of methods we're wrapping on a promise (for timeout) on the adapter.
const METHODS_TO_PROMISE_WRAP = ['set', 'exec', 'del', 'get', 'keys', 'sadd', 'srem', 'sismember', 'smembers', 'incr', 'rpush', 'pipeline', 'expire', 'mget'];

const ioredisMock = reduce([...METHODS_TO_PROMISE_WRAP, 'disconnect'], (acc, methodName) => {
  acc[methodName] = sinon.stub().resolves(methodName);
  return acc;
}, {
  once: sinon.stub()
});

const loggerMock = {
  debug: sinon.stub(),
  info: sinon.stub(),
  warn: sinon.stub(),
  error: sinon.stub()
};

let constructorParams = false;

function ioredis() {
  constructorParams = arguments;
  merge(this, ioredisMock);
}

function LogFactory() {
  return loggerMock;
}

let timeoutPromiseResolvers = [];

const timeout = sinon.spy(function timeout(ms, originalPromise) {
  const resolvers = {};
  const promise = new Promise((res, rej) => {
    resolvers.res = res;
    resolvers.rej = rej;
    resolvers.originalPromise = originalPromise;
  });

  timeoutPromiseResolvers.unshift(resolvers);

  return promise;
});

// Mocking deps ¯\_(ツ)_/¯
const RedisAdapter = proxyquire('../../RedisAdapter', {
  'ioredis': ioredis,
  '../utils/logger': { default: LogFactory },
  '../utils/promise/timeout': { default: timeout }
}).default;

/**
 * Logs here won't be changing much, so we could validate those. It's not important the exact message but what do they represent.
 */
tape('STORAGE Redis Adapter / Class', assert => {
  assert.equal(RedisAdapter.__proto__, ioredis, 'The returned class extends from the library of choice (ioredis).');

  const instance = new RedisAdapter({
    url: 'redis://localhost:6379/0',
    connectionTimeout: 10000,
    operationTimeout: 10000
  });

  assert.true(instance instanceof RedisAdapter, 'Of course created instance should be an instance of the adapter.');
  assert.true(instance instanceof ioredis, 'And as the class extends from the library, the instance is an instance of the library as well.');

  assert.true(typeof instance._options === 'object', 'The instance will have an options object.');
  assert.true(Array.isArray(instance._notReadyCommandsQueue), 'The instance will have an array as the _notReadyCommandsQueue property.');
  assert.true(instance._runningCommands instanceof _Set, 'The instance will have a set as the _runningCommands property.');

  assert.end();
});

tape('STORAGE Redis Adapter / ioredis constructor params and static method _defineLibrarySettings', assert => {
  const redisUrl = 'redis://localhost:6379/0';
  const redisParams = {
    host: 'fake_host', port: '6355', 'db': 5, pass: 'fake_pass'
  };

  new RedisAdapter({
    url: redisUrl,
    connectionTimeout: 123,
    operationTimeout: 124
  });
  // Keep in mind we're storing the arguments object, not a true array.
  assert.equal(constructorParams.length, 2, 'In this signature, the constructor receives two params.');
  assert.equal(constructorParams[0], redisUrl, 'When we use the Redis URL, that should be the first parameter passed to ioredis constructor');
  assert.deepEqual(constructorParams[1], { enableOfflineQueue: false, connectTimeout: 10000, lazyConnect: false }, 'and the second parameter would be the default settings for the lib.');

  new RedisAdapter({
    ...redisParams,
    connectionTimeout: 123,
    operationTimeout: 124
  });

  assert.equal(constructorParams.length, 1, 'In this signature, the constructor receives one param.');
  // we keep "pass" instead of "password" on our settings API to be backwards compatible.
  assert.deepEqual(constructorParams[0], { host: redisParams.host, port: redisParams.port, db: redisParams.db, password: redisParams.pass, enableOfflineQueue: false, connectTimeout: 10000, lazyConnect: false }, 'If we send all the redis params separate, it will pass one object to the library containing that and the rest of the options.');

  new RedisAdapter({
    ...redisParams,
    url: redisUrl,
    connectionTimeout: 123,
    operationTimeout: 124
  });

  assert.equal(constructorParams.length, 2, 'In this signature, the constructor receives two params.');
  assert.equal(constructorParams[0], redisUrl, 'When we use the Redis URL, even if we specified all the other params one by one the URL takes precedence, so that should be the first parameter passed to ioredis constructor');
  assert.deepEqual(constructorParams[1], { enableOfflineQueue: false, connectTimeout: 10000, lazyConnect: false }, 'and the second parameter would be the default settings for the lib.');

  assert.end();
});

tape('STORAGE Redis Adapter / static method - _defineOptions', assert => {
  const defaultOptions = {
    connectionTimeout: 10000,
    operationTimeout: 5000
  };

  assert.deepEqual(RedisAdapter._defineOptions({}), defaultOptions, 'We get the default options if we use an empty object.');

  assert.deepEqual(RedisAdapter._defineOptions({
    url: 'redis_url'
  }), {
    connectionTimeout: 10000,
    operationTimeout: 5000,
    url: 'redis_url'
  }, 'We get the merge of the provided and the default options.');

  const opts = {
    host: 'host', port: 'port', db: 'db', pass: 'pass'
  };

  assert.notEqual(RedisAdapter._defineOptions(opts), opts, 'Provided options are not mutated.');
  assert.deepEqual(opts, {host: 'host', port: 'port', db: 'db', pass: 'pass'}, 'Provided options are not mutated.');

  assert.deepEqual(RedisAdapter._defineOptions(opts), merge({}, defaultOptions, opts), 'We get the merge of the provided and the default options.');

  assert.deepEqual(RedisAdapter._defineOptions({
    random: 1,
    crap: 'I do not think I can make it',
    secret: 'shh',
    url: 'I will make it'
  }), merge({}, defaultOptions, { url: 'I will make it' }), 'Unwanted options will be skipped.');

  assert.end();
});

tape('STORAGE Redis Adapter / instance methods - _listenToEvents', assert => {
  // Reset all stubs
  sinon.resetHistory();

  assert.false(ioredisMock.once.called, 'Control assertion');
  assert.false(ioredisMock[METHODS_TO_PROMISE_WRAP[0]].called, 'Control assertion');

  const instance = new RedisAdapter({
    url: 'redis://localhost:6379/0'
  });

  assert.true(ioredisMock.once.calledTwice, 'If the method was called, it should have called the `once` function twice. If that it the case we can assume that the method was called on creation.');

  // Reset stubs again, we'll check the behaviour calling the method directly.
  sinon.resetHistory();
  assert.false(ioredisMock.once.called, 'Control assertion');
  assert.false(ioredisMock[METHODS_TO_PROMISE_WRAP[METHODS_TO_PROMISE_WRAP.length -1]].called, 'Control assertion');

  instance._listenToEvents();

  assert.true(ioredisMock.once.calledTwice, 'The "once" method of the instance should be called twice.');

  const firstCall = ioredisMock.once.getCall(0);

  assert.equal(firstCall.args[0], 'ready', 'First argument for the first call should be the "ready" event.');
  assert.equal(typeof firstCall.args[1], 'function', 'second argument for the first call should be a callback function.');

  const secondCall = ioredisMock.once.getCall(1);

  assert.equal(secondCall.args[0], 'close', 'First argument for the first call should be the "close" event.');
  assert.equal(typeof secondCall.args[1], 'function', 'second argument for the first call should be a callback function.');

  assert.false(loggerMock.warn.called, 'Control assertion');
  secondCall.args[1](); // Execute the callback for "close"

  assert.true(loggerMock.info.calledOnce, 'The callback for the "close" event will only log info to the user about what is going on.');
  assert.true(loggerMock.info.calledWithExactly('Redis connection closed.'), 'The callback for the "close" event will only log info to the user about what is going on.');

  loggerMock.info.resetHistory();
  assert.false(loggerMock.info.called, 'Control assertion');
  assert.true(Array.isArray(instance._notReadyCommandsQueue), 'Control assertion');

  // Without any offline commands queued, execute the callback for "ready"
  firstCall.args[1]();

  assert.true(loggerMock.info.called, 'The callback for the "ready" event will inform the user about the trigger.');
  assert.true(loggerMock.info.calledWithExactly('Redis connection established. Queued commands: 0.'), 'The callback for the "ready" event will inform the user about the trigger.');
  assert.equal(instance._notReadyCommandsQueue, false, 'After the DB is ready, it will clean up the offline commands queue so we do not queue commands anymore.');

  // Don't do this at home
  const queuedGetCommand = {
    command: sinon.stub().resolves(),
    name: 'GET',
    resolve: sinon.stub(),
    reject: sinon.stub()
  };
  const queuedSetCommand = {
    command: sinon.stub().rejects(),
    name: 'SET',
    resolve: sinon.stub(),
    reject: sinon.stub()
  };
  instance._notReadyCommandsQueue = [queuedGetCommand, queuedSetCommand];
  loggerMock.info.resetHistory();

  // execute the callback for "ready" once more
  firstCall.args[1]();

  assert.true(loggerMock.info.calledThrice, 'If we had queued commands, it will log the event (1 call) as well as each executed command (n calls).');
  assert.true(loggerMock.info.calledWithExactly('Redis connection established. Queued commands: 2.'), 'The callback for the "ready" event will inform the user about the trigger and the amount of queued commands.');
  assert.true(loggerMock.info.calledWithExactly('Executing queued GET command.'), 'If we had queued, it will log the event as well as each executed command.');
  assert.true(loggerMock.info.calledWithExactly('Executing queued SET command.'), 'If we had queued commands, it will log the event as well as each executed command.');

  assert.true(queuedGetCommand.command.calledOnce, 'It will execute each queued command.');
  assert.true(queuedSetCommand.command.calledOnce, 'It will execute each queued command.');

  setTimeout(() => { // Remember this is tied to a promise.
    assert.true(queuedGetCommand.resolve.called, 'And depending on what happens with the command promise, it will call the resolve or reject function for the promise wrapper.');
    assert.false(queuedGetCommand.reject.called, 'And depending on what happens with the command promise, it will call the resolve or reject function for the promise wrapper.');
    assert.true(queuedSetCommand.reject.called, 'And depending on what happens with the command promise, it will call the resolve or reject function for the promise wrapper.');
    assert.false(queuedSetCommand.resolve.called, 'And depending on what happens with the command promise, it will call the resolve or reject function for the promise wrapper.');

    assert.end();
  }, 5);
});

tape('STORAGE Redis Adapter / instance methods - _setTimeoutWrappers and queueing commands 1/2 - Error path', assert => {
  sinon.resetHistory();

  const instance = new RedisAdapter({
    url: 'redis://localhost:6379/0'
  });

  forEach(METHODS_TO_PROMISE_WRAP, methodName => {
    assert.notEqual(instance[methodName], ioredisMock[methodName], `Method "${methodName}" from redis library should be wrapped.`);
    assert.false(instance[methodName].called || ioredisMock[methodName].called, 'Checking that neither the method nor the wrapper were called yet.');

    const startingQueueLength = instance._notReadyCommandsQueue.length;

    // We do have the commands queue on this state, so a call for this methods will queue the command.
    const wrapperResult = instance[methodName](methodName);
    assert.true(wrapperResult instanceof Promise, 'The result is a promise since we are queueing commands on this state.');

    assert.equal(instance._notReadyCommandsQueue.length, startingQueueLength + 1, 'The queue should have one more item.');
    const queuedCommand = instance._notReadyCommandsQueue[0];

    assert.equal(typeof queuedCommand.resolve, 'function', 'The queued item should have the correct form.');
    assert.equal(typeof queuedCommand.reject, 'function', 'The queued item should have the correct form.');
    assert.equal(typeof queuedCommand.command, 'function', 'The queued item should have the correct form.');
    assert.equal(queuedCommand.name, methodName.toUpperCase(), 'The queued item should have the correct form.');
  });

  instance._notReadyCommandsQueue = false; // Remove the queue.
  loggerMock.error.resetHistory;

  forEach(METHODS_TO_PROMISE_WRAP, methodName => {
    // We do NOT have the commands queue on this state, so a call for this methods will execute the command.
    assert.false(ioredisMock[methodName].called, `Control assertion - Original method (${methodName}) was not yet called`);

    const previousTimeoutCalls = timeout.callCount;
    let previousRunningCommandsSize = instance._runningCommands.size;
    instance[methodName](methodName).catch(() => {}); // Swallow exception so it's not spread to logs.
    assert.true(ioredisMock[methodName].called, `Original method (${methodName}) is called right away (through wrapper) when we are not queueing anymore.`);
    assert.equal(instance._runningCommands.size, previousRunningCommandsSize + 1, 'If the result of the operation was a thenable it will add the item to the running commands queue.');

    assert.equal(timeout.callCount, previousTimeoutCalls + 1, 'The promise returned by the original method should have a timeout wrapper.');

    // Get the original promise (the one passed to timeout)
    const commandTimeoutResolver = timeoutPromiseResolvers[0];

    assert.true(timeout.calledWithExactly(5000, commandTimeoutResolver.originalPromise), 'Timeout function should have received the correct ms amount and the right promise.');
    assert.true(instance._runningCommands.has(commandTimeoutResolver.originalPromise), 'Correct promise should be the one on the _runningCommands queue.');

    commandTimeoutResolver.rej('test');
    setTimeout(() => { // Allow the promises to tick.
      assert.false(instance._runningCommands.has(commandTimeoutResolver.originalPromise), 'After a command finishes with error, it\'s promise is removed from the instance._runningCommands queue.');
      assert.true(loggerMock.error.calledWithExactly(`${methodName} operation threw an error or exceeded configured timeout of 5000ms. Message: test`), 'The log error method should be called with the corresponding messages, depending on the method, error and operationTimeout.');
    }, 0);
  });

  setTimeout(() => {
    assert.end();
  }, 200);
});

tape('STORAGE Redis Adapter / instance methods - _setTimeoutWrappers and queueing commands 2/2 - Success path', assert => {
  sinon.resetHistory();

  const instance = new RedisAdapter({
    url: 'redis://localhost:6379/0'
  });

  instance._notReadyCommandsQueue = false; // Connection is "ready"

  forEach(METHODS_TO_PROMISE_WRAP, methodName => {
    // Just call the wrapped method, we don't care about all the paths tested on the previous case, just how it behaves when the command is resolved.
    instance[methodName](methodName);
    // Get the original promise (the one passed to timeout)
    const commandTimeoutResolver = timeoutPromiseResolvers[0];

    commandTimeoutResolver.res('test');
    setTimeout(() => { // Allow the promises to tick.
      assert.false(loggerMock.error.called, 'No error should be logged');
      assert.false(instance._runningCommands.has(commandTimeoutResolver.originalPromise), 'After a command finishes successfully, it\'s promise is removed from the instance._runningCommands queue.');
    }, 0);
  });

  setTimeout(() => {
    assert.end();
  }, 200);
});

tape('STORAGE Redis Adapter / instance methods - _setDisconnectWrapper', assert => {
  sinon.resetHistory();

  const instance = new RedisAdapter({
    url: 'redis://localhost:6379/0'
  });

  assert.notEqual(instance.disconnect, ioredisMock.disconnect, 'disconnect() method from redis library should be wrapped.');

  // Call the method.
  // Note that there are no commands on the queue for this first run.
  instance.disconnect();
  assert.false(ioredisMock.disconnect.called, 'Original method should not be called right away.');

  setTimeout(() => { // o queued commands timeout wrapper.
    assert.true(loggerMock.debug.calledOnceWithExactly('No commands pending execution, disconnect.'));
    assert.true(ioredisMock.disconnect.calledOnce, 'Original method should have been called once, asynchronously');
    loggerMock.debug.resetHistory();
    ioredisMock.disconnect.resetHistory();

    // Second run, two pending commands, one will fail.
    instance._runningCommands.add(Promise.resolve());
    instance.disconnect();
    const rejectedPromise = Promise.reject('test-error');
    instance._runningCommands.add(rejectedPromise);
    rejectedPromise.catch(() => {}); // Swallow the unhandled to avoid unhandledRejection warns

    setTimeout(() => { // queued with rejection timeout wrapper
      assert.true(loggerMock.info.calledOnceWithExactly('Attempting to disconnect but there are 2 commands still waiting for resolution. Defering disconnection until those finish.'));

      Promise.all(setToArray(instance._runningCommands)).catch(e => {
        setImmediate(() => { // Allow the callback to execute before checking.
          assert.true(loggerMock.warn.calledWithExactly(`Pending commands finished with error: ${e}. Proceeding with disconnection.`), 'Should warn about the error but tell user that will disconnect anyways.');
          assert.true(ioredisMock.disconnect.calledOnce, 'Original method should have been called once, asynchronously');

          loggerMock.info.resetHistory();
          loggerMock.warn.resetHistory();
          ioredisMock.disconnect.resetHistory();

          // Third run, pending commands all successful
          instance._runningCommands.clear();
          instance._runningCommands.add(Promise.resolve());
          instance._runningCommands.add(Promise.resolve());
          instance.disconnect();
          instance._runningCommands.add(Promise.resolve());
          instance._runningCommands.add(Promise.resolve());

          setTimeout(() => {
            assert.true(loggerMock.info.calledOnceWithExactly('Attempting to disconnect but there are 4 commands still waiting for resolution. Defering disconnection until those finish.'));

            Promise.all(instance._runningCommands.values()).then(() => { // This one will go through success path
              setImmediate(() => {
                assert.true(loggerMock.debug.calledOnceWithExactly('Pending commands finished successfully, disconnecting.'));
                assert.true(ioredisMock.disconnect.calledOnce, 'Original method should have been called once, asynchronously');
              });
            });
          } ,10);
        });
      });
    },10);
  }, 10);

  setTimeout(() => {
    assert.end();
  }, 400);
});
