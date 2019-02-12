import tape from 'tape-catch';
import sinon from 'sinon';

/* eslint-disable no-console */
import { Logger, LogLevels, setLogLevel } from '../../logger/LoggerFactory';
import { LOG_LEVELS } from './index.spec.js';

const isNode = typeof process !== 'undefined' && process.version ? true : false;

tape('SPLIT LOGGER FACTORY / setLogLevel utility function', assert => {
  assert.equal(typeof setLogLevel, 'function', 'setLogLevel should be a function');
  assert.doesNotThrow(setLogLevel, 'Calling setLogLevel should not throw an error.');

  assert.end();
});

tape('SPLIT LOGGER FACTORY / LogLevels exposed mappings', assert => {
  assert.deepEqual(LogLevels, LOG_LEVELS, 'Exposed log levels should contain the levels we want.');

  assert.end();
});

tape('SPLIT LOGGER FACTORY / Logger class shape', assert => {
  assert.equal(typeof Logger, 'function', 'Logger should be a class we can instantiate.');

  const logger = new Logger('test-category', {});

  assert.equal(typeof logger.debug, 'function', 'instance.debug should be a method.');
  assert.equal(typeof logger.info, 'function', 'instance.info should be a method.');
  assert.equal(typeof logger.warn, 'function', 'instance.warn should be a method.');
  assert.equal(typeof logger.error, 'function', 'instance.error should be a method.');

  assert.end();
});

const LOG_LEVELS_IN_ORDER = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'NONE'];
/* Utility function to avoid repeating too much code */
function testLogLevels(levelToTest, assert) {
  // Builds the expected message.
  const buildExpectedMessage = (lvl, category, msg, showLevel) => {
    let res = '';
    if (showLevel) res += '[' + lvl + ']' + (lvl.length === 4 ? '  ' : ' ');
    res += category + ' => ';
    res += msg;
    return res;
  };
  // Runs the suite with the given value for showLevel option.
  const runTests = (showLevel, displayAllErrors) => {
    let logLevelLogsCounter = 0;
    let testForNoLog = false;
    const logMethod = levelToTest.toLowerCase();
    const logCategory = `test-category-${logMethod}${displayAllErrors ? 'displayAllErrors' : ''}`;
    const instance = new Logger(logCategory, {
      showLevel, displayAllErrors
    });

    LOG_LEVELS_IN_ORDER.forEach((logLevel, i) => {
      const logMsg = `Test log for level ${levelToTest} (${displayAllErrors ? 'But all errors are configured to display' : 'Errors not forced to display'}) with showLevel: ${showLevel} ${logLevelLogsCounter}`;
      const expectedMessage = buildExpectedMessage(levelToTest, logCategory, logMsg, showLevel);
      const consoleMethodToUse = !isNode && levelToTest === LOG_LEVELS.ERROR ? 'error' : 'log';

      // Log error should always be visible.
      if (logMethod === LOG_LEVELS.ERROR.toLowerCase() && displayAllErrors) testForNoLog = false;

      // Set the logLevel for this iteration.
      setLogLevel(LogLevels[logLevel]);
      // Call the method
      instance[logMethod](logMsg);
      // Assert if console.log was called.
      assert[testForNoLog ? 'notOk' : 'ok'](console[consoleMethodToUse].calledWith(expectedMessage), `Calling ${logMethod} method should ${testForNoLog ? 'NOT ' : ''}log with ${logLevel} log level. ${displayAllErrors ? 'But all errors are configured to display.' : ''}`);

      if (LOG_LEVELS_IN_ORDER.indexOf(levelToTest) <= i) {
        testForNoLog = true;
      }
      logLevelLogsCounter++;
    });
  };

  // Stub console.log & error
  sinon.spy(console, 'log');
  console.error && sinon.spy(console, 'error');

  // Show logLevel
  runTests(true);
  runTests(true, true);
  // Hide logLevel
  runTests(false);
  runTests(false, true);

  // Restore stub.
  console.log.restore();
  console.error && console.error.restore && console.error.restore();
}

tape('SPLIT LOGGER FACTORY / Logger class public methods behaviour - instance.debug', assert => {
  testLogLevels(LogLevels.DEBUG, assert);

  assert.end();
});

tape('SPLIT LOGGER FACTORY / Logger class public methods behaviour - instance.info', assert => {
  testLogLevels(LogLevels.INFO, assert);

  assert.end();
});

tape('SPLIT LOGGER FACTORY / Logger class public methods behaviour - instance.warn', assert => {
  testLogLevels(LogLevels.WARN, assert);

  assert.end();
});

tape('SPLIT LOGGER FACTORY / Logger class public methods behaviour - instance.error', assert => {
  testLogLevels(LogLevels.ERROR, assert, true);

  assert.end();
});
