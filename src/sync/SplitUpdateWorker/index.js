import killLocally from '../../storage/SplitCache/killLocally';

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
  }

  // Private method
  // Preconditions: this.splitProducer.isSynchronizingSplits === false
  __handleSplitUpdateCall() {
    if (this.maxChangeNumber > this.splitStorage.getChangeNumber()) {
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

    if (changeNumber <= currentChangeNumber && changeNumber <= this.maxChangeNumber) return;

    this.maxChangeNumber = changeNumber;

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
    killLocally(this.splitStorage, splitName, defaultTreatment, changeNumber);
    this.put(changeNumber);
  }

}