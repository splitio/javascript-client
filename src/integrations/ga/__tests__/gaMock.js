import sinon from 'sinon';

export function modelMock(fieldsObject) {
  return {
    get: function (fieldName) {
      return fieldsObject[fieldName];
    },
    set: function (fieldNameOrObject, fieldValue) {
      if (typeof fieldNameOrObject === 'object')
        fieldsObject = { ...fieldsObject, ...fieldNameOrObject };
      else
        fieldsObject[fieldNameOrObject] = fieldValue;
    }
  };
}

export function gaMock() {

  const __originalSendHitTask = sinon.spy();
  const __tasks = {
    sendHitTask: __originalSendHitTask
  };
  const ga = sinon.stub().callsFake(function (command) {
    if (command === 'send') {
      const fieldsObject = arguments[1];
      __tasks.sendHitTask(modelMock(fieldsObject));
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