/**
 * 
 * @param {*} mySegmentsStorage 
 * @param {*} mySegmentsProducer 
 */
export default function mySegmentSyncFactory(mySegmentsStorage, mySegmentsProducer) {
  
  let currentChangeNumber = -1;
  let maxChangeNumber = 0;

  // Preconditions: isMySegmentsUpdaterRunning === false
  // @TODO update this block once `/mySegments` endpoint returns `changeNumber`,
  function handleSyncMySegmentsCall() {
    if (maxChangeNumber > currentChangeNumber) {
      const currentMaxChangeNumber = maxChangeNumber;
      mySegmentsProducer.callMySegmentsUpdater().then(() => {
        currentChangeNumber = currentMaxChangeNumber;
        handleSyncMySegmentsCall();
      });
    } else {
      maxChangeNumber = 0;
    }
  }

  /**
   * Invoked on mySegmentsChange event
   *
   * @param {*} changeNumber
   * @param {*} userKey
   * @param {*} segmentList might be undefined
   */
  function queueSyncMySegments(changeNumber, segmentList) {
    // currently, since `getChangeNumber` always returns -1,
    // each mySegmentsChange notification without a segmentList triggers a `/mySegments` fetch
    // const currentChangeNumber = mySegmentsStorage.getChangeNumber();

    // if `segmentList` is present, directly call MySegmentsUpdater to update storage
    // @TODO This block might be removed once `/mySegments` endpoint returns `changeNumber`,
    // since in that case we can track the last `changeNumber` at the segment storage.
    if (segmentList && changeNumber > currentChangeNumber) {
      mySegmentsProducer.callMySegmentsUpdater(segmentList);
      currentChangeNumber = changeNumber;
      return;
    }

    if (changeNumber <= currentChangeNumber && changeNumber <= maxChangeNumber) return;

    maxChangeNumber = changeNumber;

    if (mySegmentsProducer.isMySegmentsUpdaterRunning()) return;

    handleSyncMySegmentsCall();
  }

  return {
    queueSyncMySegments
  };
}