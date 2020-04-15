import { errorParser, messageParser } from './NotificationParser';
import notificationKeeperFactory from './NotificationKeeper';
import { PushEventTypes } from '../constants';
import logFactory from '../../utils/logger';
const log = logFactory('splitio-sync:push-notifications');

export default function NotificationProcessorFactory(
  pushEmitter, // SyncManager FeedbackLoop & Update Queues
) {

  const notificationKeeper = notificationKeeperFactory(pushEmitter);

  function handleEvent(eventData, channel) {
    log.info(`Received a new Push notification of type "${eventData.type}" from channel "${channel}"`);

    switch (eventData.type) {

      /** events for NotificationProcessor */
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

      /** events for NotificationManagerKeeper */
      case PushEventTypes.OCCUPANCY:
        notificationKeeper.handleIncomingPresenceEvent(eventData, channel);
    }
  }

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
      const messageData = messageParser(message);
      handleEvent(messageData.data, messageData.channel);
    },

  };
}