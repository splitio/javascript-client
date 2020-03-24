import { EventTypes, errorParser, messageParser } from './notificationparser';
import Backoff from '../../utils/backoff';

// @TODO logging
export default function NotificationProcessorFactory(
  sseClient,
  syncManager /* feedback loop */,
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
        segmentSync.queueSyncMySegments(
          eventData.changeNumber,
          userKey,
          eventData.includesPayload ? eventData.segmentList : undefined);
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
        syncManager.startPolling(); // no harm if polling already
        break;

      // @TODO NotificationManagerKeeper
      case EventTypes.STREAMING_DOWN:
        // we don't close the SSE connection, to keep listening for STREAMING_UP events
        syncManager.startPolling();
        break;
      case EventTypes.STREAMING_UP:
        syncManager.stopPolling();
        syncManager.syncAll();
        break;
    }
  }

  return {
    handleOpen() {
      syncManager.stopPolling(); // needed on success reauth after a fail auth. In other scenarios, stopPolling will do nothing (already in PUSH mode)
      syncManager.syncAll();
      sseReconnectBackoff.reset(); // reset backoff in case SSE conexion has opened after a HTTP or network error.
    },

    handleClose() {
      syncManager.startPolling();
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