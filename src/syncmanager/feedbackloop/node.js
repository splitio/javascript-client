export default function NodeFeedbackLoopFactory(producer) {
  return {
    startPolling() {
      if (!producer.isRunning())
        producer.start();
    },

    stopPollingAnsSyncAll() {
      if (producer.isRunning())
        producer.stop();
      // fetch splits and segments.
      producer.callSplitsUpdater();
      producer.callSegmentsUpdater();
    },

    killSplit(changeNumber, splitName, defaultTreatment) {
      producer.callKillSplit(changeNumber, splitName, defaultTreatment);
    },

    syncSplits(changeNumber){
      producer.callSplitsUpdater(changeNumber);
    },

    syncSegments(changeNumber){
      producer.callSegmentsUpdater(changeNumber);
    },
  };
}