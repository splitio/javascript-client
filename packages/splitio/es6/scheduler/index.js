'use strict';

// @TODO define a minimun value for delay so we could notify developers when
// the value is too heavy.

function schedulerFactory() {
  let timeoutID = undefined;

  return {
    forever(fn /*: function */, delay /*: number */, ...fnArgs /*:? Array<any> */) /*: Promise */ {
      let firstRunReturnPromise = fn(...fnArgs);

      timeoutID = setTimeout(() => {
        this.forever(fn, delay, ...fnArgs);
      }, delay);

      return firstRunReturnPromise;
    },

    kill() {
      clearTimeout(timeoutID);
      timeoutID = undefined;
    }
  };
}

module.exports = schedulerFactory;
