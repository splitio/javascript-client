/**
 *
 * @param {*} clients map of user keys to pairs of producer and segment storage
 */
export default function mySegmentSyncFactory(clients) {

  let mySegmentsChangesQueues = [];

  // Preconditions: isMySegmentsUpdaterRunning === false
  // @TODO update this block once `/mySegments` endpoint returns `changeNumber`,
  function dequeSyncMySegmentsCall() {
    if (mySegmentsChangesQueues.length > 0) {
      const { changeNumber, userKey } = mySegmentsChangesQueues.pop();
      if (clients[userKey]) {
        const { producer, mySegmentsStorage } = clients[userKey];
        if (changeNumber > mySegmentsStorage.getChangeNumber()) {
          producer.callMySegmentsUpdater().then(
            dequeSyncMySegmentsCall
          );
        }
      }
      dequeSyncMySegmentsCall();
    }
  }

  /**
   * Invoked on mySegmentsChange event
   *
   * @param {*} changeNumber
   * @param {*} userKey
   * @param {*} segmentList might be undefined
   */
  function queueSyncMySegments(changeNumber, userKey, segmentList) {
    if (!clients[userKey]) return;

    const { producer, mySegmentsStorage } = clients[userKey];

    // if `segmentList` is present, directly call MySegmentsUpdater to update storage
    // @TODO This block might be removed once `/mySegments` endpoint returns `changeNumber`,
    // since in that case we can track the last `changeNumber` at the segment storage.
    if (!clients[userKey].changeNumber) clients[userKey].changeNumber = -1;
    if (segmentList && changeNumber > clients[userKey].changeNumber) {
      producer.callMySegmentsUpdater(segmentList);
      clients[userKey].changeNumber = changeNumber;
      return;
    }

    // currently, since `getChangeNumber` always returns -1,
    // each mySegmentsChange notification without a segmentList triggers a `/mySegments` fetch
    const currentChangeNumber = mySegmentsStorage.getChangeNumber();

    if (changeNumber <= currentChangeNumber) return;

    mySegmentsChangesQueues.push({ changeNumber, userKey });

    if (producer.isMySegmentsUpdaterRunning()) return;

    dequeSyncMySegmentsCall();
  }

  return {
    queueSyncMySegments
  };
}