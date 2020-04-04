/**
 * MySegmentSync class
 */
export default class MySegmentSync {

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
  // Preconditions: this.mySegmentsProducer.isMySegmentsUpdaterRunning === false
  // @TODO update this block once `/mySegments` endpoint returns `changeNumber`,
  __handleSyncMySegmentsCall() {
    if (this.maxChangeNumber > this.currentChangeNumber) {
      const currentMaxChangeNumber = this.maxChangeNumber;
      this.mySegmentsProducer.callMySegmentsUpdater().then(() => {
        this.currentChangeNumber = Math.max(this.currentChangeNumber, currentMaxChangeNumber); // use `currentMaxChangeNumber`, in case that `this.maxChangeNumber` was updated during fetch.
        this.__handleSyncMySegmentsCall();
      });
    } else {
      this.maxChangeNumber = 0;
    }
  }

  /**
   * Invoked on mySegmentsChange event
   *
   * @param {number} changeNumber change number of the MY_SEGMENTS_UPDATE notification
   * @param {string[] | undefined} segmentList might be undefined
   */
  queueSyncMySegments(changeNumber, segmentList) {
    // currently, since `getChangeNumber` always returns -1,
    // each mySegmentsChange notification without a segmentList triggers a `/mySegments` fetch
    // const currentChangeNumber = mySegmentsStorage.getChangeNumber();

    // if `segmentList` is present, directly call MySegmentsUpdater to update storage
    // @TODO This block might be removed once `/mySegments` endpoint returns `changeNumber`,
    // since in that case we can track the last `changeNumber` at the segment storage.
    if (segmentList && changeNumber > this.currentChangeNumber) {
      this.mySegmentsProducer.callMySegmentsUpdater(segmentList);
      this.currentChangeNumber = changeNumber;
      return;
    }

    if (changeNumber <= this.currentChangeNumber && changeNumber <= this.maxChangeNumber) return;

    this.maxChangeNumber = changeNumber;

    if (this.mySegmentsProducer.isMySegmentsUpdaterRunning()) return;

    this.__handleSyncMySegmentsCall();
  }

}