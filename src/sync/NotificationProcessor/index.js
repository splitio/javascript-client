import { errorParser, messageParser } from './notificationparser';
import Backoff from '../../utils/backoff';
import { PushEventTypes } from '../constants';

const controlPriMatcher = /control_pri$/;

// @TODO logging
export default function NotificationProcessorFactory(
  sseClient,
  pushEmitter, // feedbackLoop
  backoffBase
) {

  let isStreamingUp;

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
      case PushEventTypes.error:
        // SSE connection is closed to avoid repeated errors due to retries
        // retries are hadnled via backoff algorithm
        sseClient.close(); // it emits the event PUSH_DISCONNECT
        sseReconnectBackoff.scheduleCall();
        // pushEmitter.emit(PushEventTypes.PUSH_DISCONNECT); // no harm if polling already, but the event is already emitted when calling `sseClient.close`
        break;

      // @TODO NotificationManagerKeeper
      case PushEventTypes.OCCUPANCY:
        // logic of NotificationManagerKeeper
        if(controlPriMatcher.test(channel)) {
          if (eventData.metrics.publishers === 0 && isStreamingUp) {
            pushEmitter.emit(PushEventTypes.PUSH_DISCONNECT); // PushEventTypes.STREAMING_DOWN
            isStreamingUp = !isStreamingUp;
            break;
          }
          if (eventData.metrics.publishers !== 0 && !isStreamingUp) {
            pushEmitter.emit(PushEventTypes.PUSH_CONNECT); // PushEventTypes.STREAMING_UP
            isStreamingUp = !isStreamingUp;
            break;
          }
        }
    }
  }

  return {
    handleOpen() {
      isStreamingUp = true;
      pushEmitter.emit(PushEventTypes.PUSH_CONNECT);
      sseReconnectBackoff.reset(); // reset backoff in case SSE conexion has opened after a HTTP or network error.
    },

    handleClose() {
      pushEmitter.emit(PushEventTypes.PUSH_DISCONNECT);
    },

    handleError(error) {
      const errorData = errorParser(error);
      handleEvent(errorData);
    },

    handleMessage(message) {
      const messageData = messageParser(message);
      handleEvent(messageData.data, messageData.channel);
    },

  };
}