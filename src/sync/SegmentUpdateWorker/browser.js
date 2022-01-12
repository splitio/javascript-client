import Backoff from '../../utils/backoff';

/**
 * MySegmentUpdateWorker class
 */
export default class MySegmentUpdateWorker {

  /**
   *
   * @param {Object} mySegmentsStorage
   * @param {Object} mySegmentsProducer
   */
  constructor(mySegmentsStorage, mySegmentsProducer) {
    this.mySegmentsStorage = mySegmentsStorage;
    this.mySegmentsProducer = mySegmentsProducer;
    this.maxChangeNumber = 0; // keeps the maximum changeNumber among queued events
    this.segmentsData = undefined; // keeps the segmentsData (if included in notification payload) from the queued event with maximum changeNumber
    this.currentChangeNumber = -1; // @TODO: remove once `/mySegments` endpoint provides the changeNumber
    this.put = this.put.bind(this);
    this.__handleMySegmentUpdateCall = this.__handleMySegmentUpdateCall.bind(this);
    this.backoff = new Backoff(this.__handleMySegmentUpdateCall);
  }

  // Private method
  // Preconditions: this.mySegmentsProducer.isSynchronizingMySegments === false
  // @TODO update this block similar to SplitUpdateWorker, once `/mySegments` endpoint provides the changeNumber
  __handleMySegmentUpdateCall() {
    if (this.maxChangeNumber > this.currentChangeNumber) {
      this.handleNewEvent = false;
      const currentMaxChangeNumber = this.maxChangeNumber;

      // fetch mySegments revalidating data if cached
      this.mySegmentsProducer.synchronizeMySegments(this.segmentsData, true).then((result) => {
        if (result !== false) // Unlike `Split\SegmentUpdateWorker`, we cannot use `mySegmentsStorage.getChangeNumber` since `/mySegments` endpoint doesn't provide this value.
          this.currentChangeNumber = Math.max(this.currentChangeNumber, currentMaxChangeNumber); // use `currentMaxChangeNumber`, in case that `this.maxChangeNumber` was updated during fetch.
        if (this.handleNewEvent) {
          this.__handleMySegmentUpdateCall();
        } else {
          this.backoff.scheduleCall();
        }
      });
    }
  }

  /**
   * Invoked by NotificationProcessor on MY_SEGMENTS_UPDATE event
   *
   * @param {number} changeNumber change number of the MY_SEGMENTS_UPDATE notification
   * @param {string[] | { name: string, add: boolean } | undefined} segmentsData might be undefined
   */
  put(changeNumber, segmentsData) {
    // @TODO uncomment next line once `/mySegments` endpoint provides the changeNumber
    // const currentChangeNumber = this.mySegmentsStorage.getChangeNumber();

    if (changeNumber <= this.currentChangeNumber || changeNumber <= this.maxChangeNumber) return;

    this.maxChangeNumber = changeNumber;
    this.handleNewEvent = true;
    this.backoff.reset();
    this.segmentsData = segmentsData;

    if (this.mySegmentsProducer.isSynchronizingMySegments()) return;

    this.__handleMySegmentUpdateCall();
  }

}