/**
 * SegmentUpdateWorker class
 */
export default class SegmentUpdateWorker {

  /**
   * @param {Object} segmentsStorage
   * @param {Object} segmentsProducer
   */
  constructor(segmentsStorage, segmentsProducer) {
    this.segmentsStorage = segmentsStorage;
    this.segmentsProducer = segmentsProducer;
    this.maxChangeNumbers = {};
  }

  // Private method
  // Preconditions: this.segmentsProducer.isSynchronizingSegments === false
  __handleSegmentUpdateCall() {
    const segmentsToFetch = Object.keys(this.maxChangeNumbers).filter((segmentName) => {
      return this.maxChangeNumbers[segmentName] > this.segmentsStorage.getChangeNumber(segmentName);
    });
    // `attempts` is used as an extra stop condition for `__handleSegmentUpdateCall` recursion,
    // to limit at 2 the maximum number of fetches per update event in case `/segmentChanges`
    // requests are failing due to some network or server issue.
    if (segmentsToFetch.length > 0 && this.attempts <= 1) {
      this.attempts++;
      this.segmentsProducer.synchronizeSegment(segmentsToFetch).then(() => {
        this.__handleSegmentUpdateCall();
      });
    } else {
      this.maxChangeNumbers = {};
    }
  }

  /**
   * Invoked by NotificationProcessor on SEGMENT_UPDATE event
   *
   * @param {number} changeNumber change number of the SEGMENT_UPDATE notification
   * @param {string} segmentName segment name of the SEGMENT_UPDATE notification
   */
  put(changeNumber, segmentName) {
    const currentChangeNumber = this.segmentsStorage.getChangeNumber(segmentName);

    if (changeNumber <= currentChangeNumber || changeNumber <= this.maxChangeNumbers[segmentName]) return;

    this.maxChangeNumbers[segmentName] = changeNumber;
    this.attempts = 0;

    if (this.segmentsProducer.isSynchronizingSegments()) return;

    this.__handleSegmentUpdateCall();
  }

}