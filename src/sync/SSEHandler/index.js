import { errorParser, messageParser } from './NotificationParser';
import notificationKeeperFactory from './NotificationKeeper';
import { PUSH_RETRYABLE_ERROR, PUSH_NONRETRYABLE_ERROR, SPLIT_UPDATE, SEGMENT_UPDATE, MY_SEGMENTS_UPDATE, MY_SEGMENTS_UPDATE_V2, SPLIT_KILL, OCCUPANCY, CONTROL } from '../constants';
import logFactory from '../../utils/logger';
const log = logFactory('splitio-sync:sse-handler');

function isRetryableError(error) {
  if (error.parsedData && error.parsedData.code) {
    const code = error.parsedData.code;
    // 401 errors due to invalid or expired token (e.g., if refresh token coudn't be executed)
    if (40140 <= code && code <= 40149) return true;
    // Others 4XX errors (e.g., bad request from the SDK)
    if (40000 <= code && code <= 49999) return false;
  }
  // network errors or 5XX HTTP errors
  return true;
}

/**
 * Factory for SSEHandler
 *
 * @param {Object} pushEmitter emitter for emitting events related to feedback-loop & update queues
 */
export default function SSEHandlerFactory(pushEmitter) {

  const notificationKeeper = notificationKeeperFactory(pushEmitter);

  return {
    handleOpen() {
      notificationKeeper.handleOpen();
    },

    /* HTTP & Network errors */
    handleError(error) {
      let errorWithParsedData = error;
      try {
        errorWithParsedData = errorParser(error);
      } catch (err) {
        log.warn(`Error parsing SSE error notification: ${err}`);
      }

      let errorMessage = errorWithParsedData.parsedData && errorWithParsedData.parsedData.message;
      log.error(`Fail to connect to streaming${errorMessage ? `, with error message: "${errorMessage}"` : ''}`);

      if (isRetryableError(errorWithParsedData)) {
        pushEmitter.emit(PUSH_RETRYABLE_ERROR);
      } else {
        pushEmitter.emit(PUSH_NONRETRYABLE_ERROR);
      }
    },

    /* NotificationProcessor */
    handleMessage(message) {
      let messageWithParsedData;
      try {
        messageWithParsedData = messageParser(message);
      } catch (err) {
        log.warn(`Error parsing new SSE message notification: ${err}`);
        return;
      }

      const { parsedData, data, channel, timestamp } = messageWithParsedData;
      log.debug(`New SSE message received, with data: ${data}.`);

      // we only handle update events if streaming is up.
      if (!notificationKeeper.isStreamingUp() && [OCCUPANCY, CONTROL].indexOf(parsedData.type) === -1)
        return;

      switch (parsedData.type) {
        /* update events */
        case SPLIT_UPDATE:
          pushEmitter.emit(SPLIT_UPDATE,
            parsedData.changeNumber);
          break;
        case SEGMENT_UPDATE:
          pushEmitter.emit(SEGMENT_UPDATE,
            parsedData.changeNumber,
            parsedData.segmentName);
          break;
        case MY_SEGMENTS_UPDATE:
          pushEmitter.emit(MY_SEGMENTS_UPDATE,
            parsedData,
            channel);
          break;
        case MY_SEGMENTS_UPDATE_V2:
          pushEmitter.emit(MY_SEGMENTS_UPDATE_V2,
            parsedData);
          break;
        case SPLIT_KILL:
          pushEmitter.emit(SPLIT_KILL,
            parsedData.changeNumber,
            parsedData.splitName,
            parsedData.defaultTreatment);
          break;

        /* occupancy & control events, handled by NotificationManagerKeeper */
        case OCCUPANCY:
          notificationKeeper.handleOccupancyEvent(parsedData.metrics.publishers, channel, timestamp);
          break;
        case CONTROL:
          notificationKeeper.handleControlEvent(parsedData.controlType, channel, timestamp);
          break;

        default:
          break;
      }
    },

  };
}