class Backoff {

  /**
   * Schedule function calls with exponential backoff
   *
   * @param {function} cb
   * @param {number} baseSec
   * @param {number} maxSec
   */
  constructor(cb, baseSec, maxSec) {
    this.baseSec = baseSec || Backoff.DEFAULT_BASE_SECONDS;
    this.maxSec = maxSec || Backoff.DEFAULT_MAX_SECONDS;
    this.attempts = 0;
    this.cb = cb;
  }

  scheduleCall() {
    let delayInSec = this.baseSec * Math.pow(2, this.attempts);
    if (delayInSec > this.maxSec) delayInSec = this.maxSec;
    if (this.timeoutID) clearTimeout(this.timeoutID);
    this.timeoutID = setTimeout(() => {
      this.cb();
    }, delayInSec * 1000);
    this.attempts++;
  }

  reset() {
    this.attempts = 0;
    if (this.timeoutID) clearTimeout(this.timeoutID);
  }

}

Backoff.DEFAULT_BASE_SECONDS = 1; // 1 second
Backoff.DEFAULT_MAX_SECONDS = 1800; // 30 minutes

export default Backoff;