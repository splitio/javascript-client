// @TODO unit test
export default class Backoff {

  /**
   * Schedule function calls with exponential backoff
   *
   * @param {function} cb
   * @param {number} baseSec
   * @param {number} maxSec
   */
  constructor(cb, baseSec, maxSec) {
    this.baseSec = baseSec;
    this.maxSec = maxSec;
    this.attempts = 0;
    this.cb = cb;
  }

  scheduleCall() {
    this.attempts++;
    let delayInSec = this.baseSec * Math.pow(2, this.attempts);
    if (delayInSec > this.maxSec) delayInSec = this.maxSec;
    if (this.timeoutID) clearTimeout(this.timeoutID);
    this.timeoutID = setTimeout(() => {
      this.cb();
    }, delayInSec * 1000);
  }

  reset() {
    this.attempts = 0;
  }

}