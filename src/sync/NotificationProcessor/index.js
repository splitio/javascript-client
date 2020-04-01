import { errorParser, messageParser } from './notificationparser';
import Backoff from '../../utils/backoff';
import { PushEventTypes } from '../constants';

// @TODO logging
export default function NotificationProcessorFactory(
  sseClient,
  pushEmitter, // feedbackLoop
  backoffBase
) {

  const sseReconnectBackoff = new Backoff(sseClient.reopen.bind(sseClient), backoffBase);

  function handleEvent(eventData, channel) {
    switch (eventData.type) {
      case PushEventTypes.SPLIT_UPDATE:
        pushEmitter.emit(PushEventTypes.SPLIT_UPDATE, 
          eventData.changeNumber);
        break;
      case PushEventTypes.SEGMENT_UPDATE:
        pushEmitter.emit(PushEventTypes.SEGMENT_UPDATE, 
          eventData.changeNumber, 
          eventData.segmentName);
        break;
      case PushEventTypes.MY_SEGMENTS_UPDATE: {
        pushEmitter.emit(PushEventTypes.MY_SEGMENTS_UPDATE, 
          eventData,
          channel);
        break;
      }
      case PushEventTypes.SPLIT_KILL:
        pushEmitter.emit(PushEventTypes.SPLIT_KILL, 
          eventData.changeNumber,
          eventData.splitName,
          eventData.defaultTreatment);
        break;

      // HTTP or Network error
      case PushEventTypes.SSE_ERROR:
        // SSE connection is closed to avoid repeated errors due to retries
        // retries are hadnled via backoff algorithm
        sseClient.close();
        sseReconnectBackoff.scheduleCall();
        pushEmitter.emit(PushEventTypes.PUSH_DISCONNECT); // no harm if polling already
        break;

      // @TODO NotificationManagerKeeper
      case PushEventTypes.STREAMING_DOWN:
        // SSE connection is not closed to keep listening for STREAMING_UP events
        pushEmitter.emit(PushEventTypes.PUSH_DISCONNECT);
        break;
      case PushEventTypes.STREAMING_UP:
        pushEmitter.emit(PushEventTypes.PUSH_CONNECT);
        break;
    }
  }

  return {
    handleOpen() {
      pushEmitter.emit(PushEventTypes.PUSH_CONNECT);
      sseReconnectBackoff.reset(); // reset backoff in case SSE conexion has opened after a HTTP or network error.
    },

    handleClose() {
      pushEmitter.emit(PushEventTypes.PUSH_DISCONNECT);
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