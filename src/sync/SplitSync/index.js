/**
 * Factory of SplitsSync
 *
 * @param {*} splitStorage splits cache
 * @param {*} splitProducer node producer or full browser producer
 */
export default function splitSyncFactory(splitStorage, splitProducer) {

  let splitChangesQueue = [];

  // Preconditions: isSplitsUpdaterRunning === false
  function dequeSyncSplitsCall() {
    if (splitChangesQueue.length > 0) {
      if (splitChangesQueue[splitChangesQueue.length - 1] > splitStorage.getChangeNumber()) {
        splitProducer.callSplitsUpdater().then(
          dequeSyncSplitsCall
        );
      } else {
        splitChangesQueue.pop();
        dequeSyncSplitsCall();
      }
    }
  }

  // Invoked on splitChange event
  function queueSyncSplits(changeNumber) {
    const currentChangeNumber = splitStorage.getChangeNumber();

    if (changeNumber <= currentChangeNumber) return;

    splitChangesQueue.push(changeNumber);

    if (splitProducer.isSplitsUpdaterRunning()) return;

    dequeSyncSplitsCall();
  }

  function killSplit(changeNumber, splitName, defaultTreatment) {
    splitStorage.killSplit(splitName, defaultTreatment);
    queueSyncSplits(changeNumber);
  }

  return {
    queueSyncSplits,
    killSplit,
  };
}