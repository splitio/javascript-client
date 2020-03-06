import { Types, errorParser, messageParser } from './notificationparser';

// @TODO logging
export default function NotificationProcessorFactory(feedbackLoop) {
  return {
    handleOpen() {
      feedbackLoop.stopPollingAndSyncAll();
    },

    handleClose() {
      feedbackLoop.startPolling();
    },

    handleError(error) {
      const parsedError = errorParser(error);
      switch (parsedError.type) {
        case Types.STREAMING_DOWN:
          feedbackLoop.startPolling();
          break;
      }
    },

    handleMessage(message) {
      const parsedMessage = messageParser(message);
      switch (parsedMessage.type) {
        case Types.SPLIT_UPDATE:
          feedbackLoop.syncSplits(parsedMessage.changeNumber);
          break;
        case Types.SEGMENT_UPDATE:
          feedbackLoop.syncSegments(parsedMessage.changeNumber);
          break;
        case Types.SPLIT_KILL:
          feedbackLoop.killSplit(parsedMessage.changeNumber, parsedMessage.splitName, parsedMessage.defaultTreatment);
          break;
      }
    }
  };
}