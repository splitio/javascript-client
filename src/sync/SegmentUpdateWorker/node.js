import Backoff from '../../utils/backoff';

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
    this.put = this.put.bind(this);
    this.__handleSegmentUpdateCall = this.__handleSegmentUpdateCall.bind(this);
    this.backoff = new Backoff(this.__handleSegmentUpdateCall);
  }

  // Private method
  // Preconditions: this.segmentsProducer.isSynchronizingSegments === false
  // Approach similar to MySegmentUpdateWorker due to differences on Segments notifications and endpoint changeNumbers
  __handleSegmentUpdateCall() {
    const segmentsToFetch = Object.keys(this.maxChangeNumbers).filter((segmentName) => {
      return this.maxChangeNumbers[segmentName] > this.segmentsStorage.getChangeNumber(segmentName);
    });
    if (segmentsToFetch.length > 0) {
      this.handleNewEvent = false;
      const currentMaxChangeNumbers = segmentsToFetch.map(segmentToFetch => this.maxChangeNumbers[segmentToFetch]);

      // fetch segments revalidating data if cached
      this.segmentsProducer.synchronizeSegment(segmentsToFetch, true).then((result) => {
        // Unlike `SplitUpdateWorker` where changeNumber is consistent between notification and endpoint, if there is no error,
        // we must clean the `maxChangeNumbers` of those segments that didn't receive a new update notification during the fetch.
        if (result !== false) {
          segmentsToFetch.forEach((fetchedSegment, index) => {
            if (this.maxChangeNumbers[fetchedSegment] === currentMaxChangeNumbers[index]) this.maxChangeNumbers[fetchedSegment] = -1;
          });
        } else {
          // recursive invocation with backoff if there was some error
          this.backoff.scheduleCall();
        }

        // immediate recursive invocation if a new notification was queued during fetch
        if (this.handleNewEvent) {
          this.__handleSegmentUpdateCall();
        }
      });
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
    this.handleNewEvent = true;
    this.backoff.reset();

    if (this.segmentsProducer.isSynchronizingSegments()) return;

    this.__handleSegmentUpdateCall();
  }

}