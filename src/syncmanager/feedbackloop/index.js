export default function FeedbackLoopFactory(producer, connectCallback) {

  const producersWithMySegmentsUpdater = {};

  return {
    // The following two methods are only for browser
    addProducerWithMySegmentsUpdater(userKey, producer) {
      producersWithMySegmentsUpdater[userKey] = producer;
    },
    // eslint-disable-next-line no-unused-vars
    removeProducerWithMySegmentsUpdater(userKey, producer) {
      delete producersWithMySegmentsUpdater[userKey];
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

    // @REVIEW maybe this method is not necessary, except that NotificationProcessor ask to reconnect
    // (i.e., authenticate and open de SSE connection) for some events, such as internet connected
    reconnectPush() {
      connectCallback();
    },

    // The following methods are responsability of `Queues` in the spec, but for simplicity, queues are handled by Feedbackloop
    queueKillSplit(changeNumber, splitName, defaultTreatment) {
      // @TODO use queue
      producer.callKillSplit(changeNumber, splitName, defaultTreatment);
    },

    queueSyncSplits(changeNumber) {
      // @TODO use queue
      producer.callSplitsUpdater(changeNumber);
    },

    queueSyncSegments(changeNumber, segmentName) {
      // @TODO use queue
      producer.callSegmentsUpdater(changeNumber, segmentName);
    },

    queueSyncMySegments(changeNumber, userKey, segmentList) {
      // @TODO use queue
      if (producersWithMySegmentsUpdater[userKey])
        producersWithMySegmentsUpdater[userKey].callMySegmentsUpdater(changeNumber, segmentList);
    },
  };
}