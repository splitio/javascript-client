import sinon from 'sinon';

export function gaMock() {

  const model = {
    get: sinon.fake(function () { return undefined; })
  };

  const __originalSendHitTask = sinon.spy();
  const __tasks = {
    sendHitTask: __originalSendHitTask
  };
  const ga = sinon.stub().callsFake(function (command) {
    if (command === 'send') {
      __tasks.sendHitTask(model);
    }
  });

  const set = sinon.fake(function (taskName, taskFunc) {
    __tasks[taskName] = taskFunc;
  });
  const get = sinon.fake(function (taskName) {
    return __tasks[taskName];
  });

  // Add ga to window object
  if (typeof window === 'undefined') {
    if (global) global.window = {};
  }
  window['GoogleAnalyticsObject'] = 'ga';
  window['ga'] = window['ga'] || ga;

  return {
    ga,
    tracker: {
      get,
      set,
      __originalSendHitTask,
    }
  };
}

export function gaRemove() {
  if (typeof window !== 'undefined')
    window[window['GoogleAnalyticsObject'] || 'ga'] = undefined;
}