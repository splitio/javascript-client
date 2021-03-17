import Backoff from '../../utils/backoff';

/**
 * SplitUpdateWorker class
 */
export default class SplitUpdateWorker {

  /**
   * @param {Object} splitStorage splits cache
   * @param {Object} splitProducer node producer or full browser producer
   * @param {Object} splitsEventEmitter
   */
  constructor(splitStorage, splitProducer, splitsEventEmitter) {
    this.splitStorage = splitStorage;
    this.splitProducer = splitProducer;
    this.maxChangeNumber = 0;
    this.splitsEventEmitter = splitsEventEmitter;
    this.put = this.put.bind(this);
    this.killSplit = this.killSplit.bind(this);
    this.__handleSplitUpdateCall = this.__handleSplitUpdateCall.bind(this);
    this.backoff = new Backoff(this.__handleSplitUpdateCall);
  }

  // Private method
  // Preconditions: this.splitProducer.isSynchronizingSplits === false
  __handleSplitUpdateCall() {
    if (this.maxChangeNumber > this.splitStorage.getChangeNumber()) {
      this.handleNewEvent = false;

      // fetch splits revalidating data if cached
      this.splitProducer.synchronizeSplits(true).then(() => {
        if (this.handleNewEvent) {
          this.__handleSplitUpdateCall();
        } else {
          // fetch new registered segments for server-side API. Not retrying on error
          if(this.splitProducer.synchronizeSegment) this.splitProducer.synchronizeSegment(undefined, false, true);
          this.backoff.scheduleCall();
        }
      });
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
    this.handleNewEvent = true;
    this.backoff.reset();

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
    // @TODO handle retry due to errors in storage, once we allow the definition of custom async storages
    this.splitStorage.killLocally(splitName, defaultTreatment, changeNumber).then((updated) => {
      // trigger an SDK_UPDATE if Split was killed locally
      if (updated) this.splitsEventEmitter.emit(this.splitsEventEmitter.SDK_SPLITS_ARRIVED, true);
      // queues the SplitChanges fetch (only if changeNumber is newer)
      this.put(changeNumber);
    });
  }

}