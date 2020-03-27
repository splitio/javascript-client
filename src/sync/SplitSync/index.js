import killLocally from '../../storage/SplitCache/killLocally';

/**
 * SplitsSync class
 */
export default class SplitSync {

  /**
   *
   * @param {Object} splitStorage splits cache
   * @param {Object} splitProducer node producer or full browser producer
   */
  constructor(splitStorage, splitProducer) {
    this.splitStorage = splitStorage;
    this.splitProducer = splitProducer;
    this.maxChangeNumber = 0;
  }

  // Private method
  // Preconditions: this.splitProducer.isSplitsUpdaterRunning === false
  __handleSyncSplitsCall() {
    if (this.maxChangeNumber > this.splitStorage.getChangeNumber()) {
      this.splitProducer.callSplitsUpdater().then(() => {
        this.__handleSyncSplitsCall();
      });
    } else {
      this.maxChangeNumber = 0;
    }
  }

  // Invoked on SPLIT_UPDATE notification
  // return true if a `/splitChanges` fetch was queued, i.e., if `changeNumber` is mayor than the current changeNumber and mayor than the last queued ones
  queueSplitChanges(changeNumber) {
    const currentChangeNumber = this.splitStorage.getChangeNumber();

    if (changeNumber <= currentChangeNumber && changeNumber <= this.maxChangeNumber) return false;

    this.maxChangeNumber = changeNumber;

    if (this.splitProducer.isSplitsUpdaterRunning()) return true;

    this.__handleSyncSplitsCall();

    return true;
  }

  // Invoked on SPLIT_KILL notification
  killSplit(changeNumber, splitName, defaultTreatment) {
    if (this.queueSplitChanges(changeNumber))
      // only kill split if the `/splitChanges` fetch was queued. Otherwise, the kill has been already handled
      killLocally(this.splitStorage, splitName, defaultTreatment, changeNumber);
  }

}