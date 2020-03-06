import { Types, errorParser, messageParser } from './notificationparser';

// @TODO logging
export default function NotificationProcessorFactory(feedbackLoop) {
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
      const parsedError = errorParser(error);
      this.handleEvent(parsedError);
    },

    handleMessage(message) {
      const parsedMessage = messageParser(message);
      // @TODO logic of NotificationManagerKeeper
      this.handleEvent(parsedMessage);
    },

    handleEvent(parsedEvent) {
      switch (parsedEvent.type) {
        case Types.SPLIT_UPDATE:
          feedbackLoop.queueSyncSplits(parsedEvent.changeNumber);
          break;
        case Types.SEGMENT_UPDATE:
          feedbackLoop.queueSyncSegments(parsedEvent.changeNumber);
          break;
        case Types.MYSEGMENT_UPDATE:
          feedbackLoop.queueSyncMySegments(parsedEvent.changeNumber, parsedEvent.splitKey);
          break;
        case Types.SPLIT_KILL:
          feedbackLoop.queueKillSplit(parsedEvent.changeNumber, parsedEvent.splitName, parsedEvent.defaultTreatment);
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
  };
}