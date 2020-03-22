import { EventTypes, errorParser, messageParser } from './notificationparser';

// @TODO logging
export default function NotificationProcessorFactory(callbacks, userKeyHashes) {

  function handleEvent(eventData, channel) {
    switch (eventData.type) {
      case EventTypes.SPLIT_UPDATE:
        callbacks.splitSync.queueSyncSplits(
          eventData.changeNumber);
        break;
      case EventTypes.SEGMENT_UPDATE:
        callbacks.segmentSync.queueSyncSegments(
          eventData.changeNumber,
          eventData.segmentName);
        break;
      case EventTypes.MY_SEGMENTS_UPDATE: {
        // @TODO test the following way to get the userKey from the channel hash
        const userKeyHash = channel.split('_')[2];
        const userKey = userKeyHashes[userKeyHash];
        callbacks.segmentSync.queueSyncMySegments(
          eventData.changeNumber,
          userKey,
          eventData.includesPayload ? eventData.segmentList : undefined);
        break;
      }
      case EventTypes.SPLIT_KILL:
        callbacks.splitSync.killSplit(
          eventData.changeNumber,
          eventData.splitName,
          eventData.defaultTreatment);
        break;
      // @REVIEW do we need to close the connection if STREAMING_DOWN?
      case EventTypes.STREAMING_DOWN:
        callbacks.startPolling();
        break;
      case EventTypes.STREAMING_UP:
        callbacks.stopPolling();
        callbacks.syncAll();
        break;
      // @REVIEW is there some scenario where we should consider a DISCONNECT event type?
      case EventTypes.RECONNECT:
        callbacks.connectPush();
        break;
    }
  }

  return {
    handleOpen() {
      // @REVIEW: call handleEvent({type: EventTypes.STREAMING_UP}); // or EventTypes.STREAMING_RECONNECTED according to spec
      callbacks.syncAll();
    },

    handleClose() {
      // @REVIEW: call handleEvent({type: EventTypes.STREAMING_DOWN});
      callbacks.startPolling();
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
      handleEvent(messageData.data, messageData.channel);
    },

  };
}