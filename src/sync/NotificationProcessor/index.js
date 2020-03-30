import { EventTypes, errorParser, messageParser } from './notificationparser';
import Backoff from '../../utils/backoff';
import { MY_SEGMENT_SYNC } from '../../utils/context/constants';

// @TODO logging
export default function NotificationProcessorFactory(
  sseClient,
  feedbackLoop,
  splitSync,
  segmentSync,
  backoffBase,
  userKeyHashes
) {

  const sseReconnectBackoff = new Backoff(sseClient.reopen.bind(sseClient), backoffBase);

  function handleEvent(eventData, channel) {
    switch (eventData.type) {
      case EventTypes.SPLIT_UPDATE:
        splitSync.queueSyncSplits(
          eventData.changeNumber);
        break;
      case EventTypes.SEGMENT_UPDATE:
        segmentSync.queueSyncSegments(
          eventData.changeNumber,
          eventData.segmentName);
        break;
      case EventTypes.MY_SEGMENTS_UPDATE: {
        // @TODO test the following way to get the userKey from the channel hash
        const userKeyHash = channel.split('_')[2];
        const userKey = userKeyHashes[userKeyHash];
        if (userKey && segmentSync[userKey]) { // check context since it can be undefined if client has been destroyed
          const mySegmentSync = segmentSync[userKey].get(MY_SEGMENT_SYNC, true);
          mySegmentSync && mySegmentSync.queueSyncMySegments(
            eventData.changeNumber,
            eventData.includesPayload ? eventData.segmentList : undefined);
        }
        break;
      }
      case EventTypes.SPLIT_KILL:
        splitSync.killSplit(
          eventData.changeNumber,
          eventData.splitName,
          eventData.defaultTreatment);
        break;

      // HTTP or Network error
      case EventTypes.SSE_ERROR:
        // close the conexion to avoid repeated errors due to retries
        // retries are hadnled via backoff algorithm
        sseClient.close();
        sseReconnectBackoff.scheduleCall();
        feedbackLoop.onPushDisconnect(); // no harm if polling already
        break;

      // @TODO NotificationManagerKeeper
      case EventTypes.STREAMING_DOWN:
        // we don't close the SSE connection, to keep listening for STREAMING_UP events
        feedbackLoop.onPushDisconnect();
        break;
      case EventTypes.STREAMING_UP:
        feedbackLoop.onPushConnect();
        break;
    }
  }

  return {
    handleOpen() {
      feedbackLoop.onPushConnect();
      sseReconnectBackoff.reset(); // reset backoff in case SSE conexion has opened after a HTTP or network error.
    },

    handleClose() {
      feedbackLoop.onPushDisconnect();
    },

    handleError(error) {
      const errorData = errorParser(error);
      // @TODO logic of NotificationManagerKeeper
      handleEvent(errorData);
    },

    handleMessage(message) {
      const messageData = messageParser(message);
      // @TODO logic of NotificationManagerKeeper
      handleEvent(messageData.data, messageData.channel);
    },

  };
}