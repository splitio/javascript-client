export default function FeedbackLoopFactory(producer, connectCallback) {

  const producersWithMySegmentsUpdater = {};

  return {
    addProducerWithMySegmentsUpdater(splitKey, producer) {
      producersWithMySegmentsUpdater[splitKey] = producer;
    },
    // eslint-disable-next-line no-unused-vars
    removeProducerWithMySegmentsUpdater(splitKey, producer) {
      delete producersWithMySegmentsUpdater[splitKey];
    },

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

    // @REVIEW maybe this method is not necessary, at least that NotificationProcessor have to reconnect
    // (i.e., authenticate and open de SSE connection) for some events
    reconnectPush() {
      connectCallback();
    },

    queueKillSplit(changeNumber, splitName, defaultTreatment) {
      // @TODO use queue
      producer.callKillSplit(changeNumber, splitName, defaultTreatment);
    },

    queueSyncSplits(changeNumber) {
      // @TODO use queue
      producer.callSplitsUpdater(changeNumber);
    },

    queueSyncSegments(changeNumber) {
      // @TODO use queue
      producer.callSegmentsUpdater(changeNumber);
    },

    queueSyncMySegments(changeNumber, splitKey) {
      // @TODO use queue
      if (producersWithMySegmentsUpdater[splitKey])
        producersWithMySegmentsUpdater[splitKey].callMySegmentsUpdater(changeNumber);
    },
  };
}