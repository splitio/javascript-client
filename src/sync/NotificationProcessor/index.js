import { errorParser, messageParser } from './NotificationParser';
import notificationKeeperFactory from './NotificationKeeper';
import { PushEventTypes } from '../constants';
import logFactory from '../../utils/logger';
const log = logFactory('splitio-sync:push-notifications');

// in terms of the PUSH spec, this factory is actually the SSEHandler, and its `handleMessage` method is the `NotificationProcessor`
export default function NotificationProcessorFactory(
  pushEmitter, // SyncManager FeedbackLoop & Update Queues
) {

  const notificationKeeper = notificationKeeperFactory(pushEmitter);

  return {
    handleOpen() {
      notificationKeeper.handleOpen();
    },

    /** HTTP & Network errors */
    handleError(error) {
      const parsedError = errorParser(error);
      pushEmitter.emit(PushEventTypes.SSE_ERROR, parsedError);
    },

    handleMessage(message) {
      const { parsedData, channel } = messageParser(message);

      log.info(`New push message received, with data: "${message.data}".`);

      // we only handle update events if streaming is up.
      if (!notificationKeeper.isStreamingUp() && parsedData.type !== PushEventTypes.OCCUPANCY && parsedData.type !== PushEventTypes.CONTROL)
        return;

      switch (parsedData.type) {
        /** update events for NotificationProcessor */
        case PushEventTypes.SPLIT_UPDATE:
          pushEmitter.emit(PushEventTypes.SPLIT_UPDATE,
            parsedData.changeNumber);
          break;

        case PushEventTypes.SEGMENT_UPDATE:
          pushEmitter.emit(PushEventTypes.SEGMENT_UPDATE,
            parsedData.changeNumber,
            parsedData.segmentName);
          break;

        case PushEventTypes.MY_SEGMENTS_UPDATE:
          pushEmitter.emit(PushEventTypes.MY_SEGMENTS_UPDATE,
            parsedData,
            channel);
          break;

        case PushEventTypes.SPLIT_KILL:
          pushEmitter.emit(PushEventTypes.SPLIT_KILL,
            parsedData.changeNumber,
            parsedData.splitName,
            parsedData.defaultTreatment);
          break;

        /** occupancy & control events for NotificationManagerKeeper */
        case PushEventTypes.OCCUPANCY:
          notificationKeeper.handleOccupancyEvent(parsedData, channel);
          break;

        case PushEventTypes.CONTROL:
          notificationKeeper.handleControlEvent(parsedData, channel);

      }
    },

  };
}