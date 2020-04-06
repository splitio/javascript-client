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
    this.maxChangeNumber = 0;
    this.currentChangeNumber = -1; // @TODO: remove once `/mySegments` endpoint provides the changeNumber
  }

  // Private method
  // Preconditions: this.mySegmentsProducer.isSynchronizeMySegmentsRunning === false
  // @TODO update this block once `/mySegments` endpoint provides the changeNumber
  __handleMySegmentUpdateCall() {
    if (this.maxChangeNumber > this.currentChangeNumber) {
      const currentMaxChangeNumber = this.maxChangeNumber;
      this.mySegmentsProducer.synchronizeMySegments().then(() => {
        this.currentChangeNumber = Math.max(this.currentChangeNumber, currentMaxChangeNumber); // use `currentMaxChangeNumber`, in case that `this.maxChangeNumber` was updated during fetch.
        this.__handleMySegmentUpdateCall();
      });
    } else {
      this.maxChangeNumber = 0;
    }
  }

  /**
   * Invoked by NotificationProcessor on MY_SEGMENTS_UPDATE event
   *
   * @param {number} changeNumber change number of the MY_SEGMENTS_UPDATE notification
   * @param {string[] | undefined} segmentList might be undefined
   */
  put(changeNumber, segmentList) {
    // if `segmentList` is present, directly call MySegmentsUpdater to update storage
    if (segmentList && changeNumber > this.currentChangeNumber) {
      this.mySegmentsProducer.synchronizeMySegments(segmentList);
      // @TODO remove next line once `/mySegments` endpoint provides the changeNumber, since in that case we can track it at the segment storage.
      this.currentChangeNumber = changeNumber;
      return;
    }

    if (changeNumber <= this.currentChangeNumber && changeNumber <= this.maxChangeNumber) return;

    this.maxChangeNumber = changeNumber;

    if (this.mySegmentsProducer.isSynchronizeMySegmentsRunning()) return;

    this.__handleMySegmentUpdateCall();
  }

}