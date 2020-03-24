import { EventTypes, errorParser, messageParser } from './notificationparser';
import Backoff from '../../utils/backoff';

// @TODO logging
export default function NotificationProcessorFactory(sseClient, backoffBase, callbacks, userKeyHashes) {

  const sseReconnectBackoff = new Backoff(sseClient.reopen.bind(sseClient), backoffBase);

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

      // @TODO check if we should call pushmanager.scheduleReAuth or something like that, as we do when Auth fails due to a HTTP or Network errors.
      // HTTP or Network error
      case EventTypes.SSE_ERROR:
        // We must close the conexion to avoid error loop in the connection
        callbacks.closeSSEconnection();
        sseReconnectBackoff.scheduleCall();
        callbacks.startPolling(); // no harm if polling already
        break;

      // @TODO NotificationManagerKeeper
      case EventTypes.STREAMING_DOWN:
        // we don't close the SSE connection, to keep listening for STREAMING_UP events
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
      callbacks.stopPolling(); // needed on success reauth after a fail auth. In other scenarios, stopPolling will do nothing (already in PUSH mode)
      callbacks.syncAll();
      sseReconnectBackoff.reset();
    },

    handleClose() {
      // @REVIEW: call handleEvent({type: EventTypes.STREAMING_DOWN});
      callbacks.startPolling();
    },

    handleError(error) {
      const errorData = errorParser(error);
      // @TODO logic of NotificationManagerKeeper?
      handleEvent(errorData);
    },

    handleMessage(message) {
      const messageData = messageParser(message);
      // @TODO logic of NotificationManagerKeeper
      handleEvent(messageData.data, messageData.channel);
    },

  };
}