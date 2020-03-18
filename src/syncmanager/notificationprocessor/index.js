import { Types, errorParser, messageParser } from './notificationparser';

// @TODO logging
export default function NotificationProcessorFactory(feedbackLoop, userKeyHashes) {

  function handleEvent(eventData, channel) {
    switch (eventData.type) {
      case Types.SPLIT_UPDATE:
        feedbackLoop.queueSyncSplits(
          eventData.changeNumber);
        break;
      case Types.SEGMENT_UPDATE:
        feedbackLoop.queueSyncSegments(
          eventData.changeNumber,
          eventData.segmentName);
        break;
      case Types.MY_SEGMENTS_UPDATE: {
        // @TODO test the following way to get the userKey from the channel hash
        const userKeyHash = channel.split('_')[2];
        const userKey = userKeyHashes[userKeyHash];
        feedbackLoop.queueSyncMySegments(
          eventData.changeNumber,
          userKey,
          eventData.includesPayload ? eventData.segmentList : undefined);
        break;
      }
      case Types.SPLIT_KILL:
        feedbackLoop.killSplit(
          eventData.changeNumber,
          eventData.splitName,
          eventData.defaultTreatment);
        break;
      // @REVIEW do we need to close the connection if STREAMING_DOWN?
      case Types.STREAMING_DOWN:
        feedbackLoop.startPolling();
        break;
      case Types.STREAMING_UP:
        feedbackLoop.stopPollingAndSyncAll();
        break;
      // @REVIEW is there some scenario where we should consider a DISCONNECT event type?
      case Types.RECONNECT:
        feedbackLoop.reconnectPush();
        break;
    }
  }

  return {
    handleOpen() {
      // @REVIEW: call handleEvent({type: Types.STREAMING_UP}); // or Types.STREAMING_RECONNECTED according to spec
      feedbackLoop.stopPollingAndSyncAll();
    },

    handleClose() {
      // @REVIEW: call handleEvent({type: Types.STREAMING_DOWN});
      feedbackLoop.startPolling();
    },

    handleError(error) {
      const errorData = errorParser(error);
      // @TODO logic of NotificationManagerKeeper
      // @TODO close connection to avoid reconnect loop
      this.handleEvent(errorData);
    },

    handleMessage(message) {
      const messageData = messageParser(message);
      // @TODO logic of NotificationManagerKeeper
      handleEvent(messageData.data, message.channel);
    },

  };
}