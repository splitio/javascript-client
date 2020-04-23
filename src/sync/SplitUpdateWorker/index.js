/**
 * SplitUpdateWorker class
 */
export default class SplitUpdateWorker {

  /**
   * @param {Object} splitStorage splits cache
   * @param {Object} splitProducer node producer or full browser producer
   */
  constructor(splitStorage, splitProducer) {
    this.splitStorage = splitStorage;
    this.splitProducer = splitProducer;
    this.maxChangeNumber = 0;
    this.put = this.put.bind(this);
    this.killSplit = this.killSplit.bind(this);
  }

  // Private method
  // Preconditions: this.splitProducer.isSynchronizingSplits === false
  __handleSplitUpdateCall() {
    // `attempts` is used as an extra stop condition for `__handleSplitUpdateCall` recursion,
    // to limit at 2 the maximum number of fetches per update event in case `/splitChanges`
    // requests are failing due to some network or server issue.
    if (this.maxChangeNumber > this.splitStorage.getChangeNumber() && this.attempts <= 1) {
      this.attempts++;
      this.splitProducer.synchronizeSplits().then(() => {
        this.__handleSplitUpdateCall();
      });
    } else {
      this.maxChangeNumber = 0;
    }
  }

  /**
   * Invoked by NotificationProcessor on SPLIT_UPDATE event
   *
   * @param {number} changeNumber change number of the SPLIT_UPDATE notification
   */
  put(changeNumber) {
    const currentChangeNumber = this.splitStorage.getChangeNumber();

    if (changeNumber <= currentChangeNumber || changeNumber <= this.maxChangeNumber) return;

    this.maxChangeNumber = changeNumber;
    this.attempts = 0;

    if (this.splitProducer.isSynchronizingSplits()) return;

    this.__handleSplitUpdateCall();
  }

  /**
   * Invoked by NotificationProcessor on SPLIT_KILL event
   *
   * @param {number} changeNumber change number of the SPLIT_UPDATE notification
   * @param {string} splitName name of split to kill
   * @param {string} defaultTreatment default treatment value
   */
  killSplit(changeNumber, splitName, defaultTreatment) {
    this.splitStorage.killLocally(splitName, defaultTreatment, changeNumber);
    this.put(changeNumber);
  }

}