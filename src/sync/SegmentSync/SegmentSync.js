/**
 *
 * @param {*} segmentsStorage
 * @param {*} segmentsProducer
 */
export default function segmentSyncFactory(segmentsStorage, segmentsProducer) {

  let segmentsChangesQueues = [];

  // Preconditions: isSegmentsUpdaterRunning === false
  function dequeSyncSegmentsCall() {
    if (segmentsChangesQueues.length > 0) {
      const { changeNumber, segmentName } = segmentsChangesQueues[segmentsChangesQueues.length - 1];
      if (changeNumber > segmentsStorage.getChangeNumber(segmentName)) {
        segmentsProducer.callSegmentsUpdater([segmentName]).then(
          dequeSyncSegmentsCall
        );
      } else {
        segmentsChangesQueues.pop();
        dequeSyncSegmentsCall();
      }
    }
  }

  // Invoked on segmentsChange event
  function queueSyncSegments(changeNumber, segmentName) {
    const currentChangeNumber = segmentsStorage.getChangeNumber(segmentName);

    if (changeNumber <= currentChangeNumber) return;

    segmentsChangesQueues.push({ changeNumber, segmentName });

    if (segmentsProducer.isSegmentsUpdaterRunning()) return;

    dequeSyncSegmentsCall();
  }

  return {
    queueSyncSegments
  };
}