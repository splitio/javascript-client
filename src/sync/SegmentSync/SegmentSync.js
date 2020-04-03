/**
 * SegmentSync class
 */
export default class SegmentSync {

  /**
   * @param {Object} segmentsStorage
   * @param {Object} segmentsProducer
   */
  constructor(segmentsStorage, segmentsProducer) {
    this.segmentsStorage = segmentsStorage;
    this.segmentsProducer = segmentsProducer;
    this.segmentsChangesQueue = [];
  }

  // Private method
  // Preconditions: this.segmentsProducer.isSegmentsUpdaterRunning === false
  __handleSyncSegmentsCall() {
    if (this.segmentsChangesQueue.length > 0) {
      const { changeNumber, segmentName } = this.segmentsChangesQueue[this.segmentsChangesQueue.length - 1];
      if (changeNumber > this.segmentsStorage.getChangeNumber(segmentName)) {
        this.segmentsProducer.callSegmentsUpdater([segmentName]).then(() => {
          this.__handleSyncSegmentsCall();
        });
      } else {
        this.segmentsChangesQueue.pop();
        this.__handleSyncSegmentsCall();
      }
    }
  }

  /**
   * Invoked on SEGMENT_UPDATE notification.
   *
   * @param {string} segmentName segment name of the SEGMENT_UPDATE notification
   * @param {number} changeNumber change number of the SEGMENT_UPDATE notification
   */
  queueSyncSegments(segmentName, changeNumber) {
    const currentChangeNumber = this.segmentsStorage.getChangeNumber(segmentName);

    if (changeNumber <= currentChangeNumber) return;

    this.segmentsChangesQueue.push({ segmentName, changeNumber });

    if (this.segmentsProducer.isSegmentsUpdaterRunning()) return;

    this.__handleSyncSegmentsCall();
  }

}