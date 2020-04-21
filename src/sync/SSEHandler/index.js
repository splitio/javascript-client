import { errorParser, messageParser } from './NotificationParser';
import notificationKeeperFactory from './NotificationKeeper';
import { SSE_ERROR, SPLIT_UPDATE, SEGMENT_UPDATE, MY_SEGMENTS_UPDATE, SPLIT_KILL, OCCUPANCY, CONTROL } from '../constants';
import logFactory from '../../utils/logger';
const log = logFactory('splitio-sync:sse-handler');

export default function SSEHandlerFactory(
  pushEmitter, // SyncManager FeedbackLoop & Update Queues
) {

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
        log.error(`Error parsing SSE error notification: ${err}`);
      }

      pushEmitter.emit(SSE_ERROR, errorWithParsedData);
    },

    /* NotificationProcessor */
    handleMessage(message) {
      log.info(`New SSE message received, with data: "${message.data}".`);

      let messageWithParsedData;
      try {
        messageWithParsedData = messageParser(message);
      } catch (err) {
        log.error(`Error parsing SSE message notification: ${err}`);
        return;
      }

      const { parsedData, channel, timestamp } = messageWithParsedData;

      // we only handle update events if streaming is up.
      if (!notificationKeeper.isStreamingUp() && parsedData.type !== OCCUPANCY && parsedData.type !== CONTROL)
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

      }
    },

  };
}