import { PushEventTypes } from '../constants';

const controlPriMatcher = /control_pri$/;

export default function notificationKeeperFactory(feedbackLoopEmitter) {

  let isStreamingUp;

  return {
    handleOpen() {
      isStreamingUp = true;
      feedbackLoopEmitter.emit(PushEventTypes.PUSH_CONNECT);
    },

    handleIncomingPresenceEvent(parsedData, channel) {
      // logic of NotificationManagerKeeper
      if (controlPriMatcher.test(channel)) {
        if (parsedData.metrics.publishers === 0 && isStreamingUp) {
          isStreamingUp = false;
          feedbackLoopEmitter.emit(PushEventTypes.PUSH_DISCONNECT); // notify(STREAMING_DOWN) in spec
        }
        if (parsedData.metrics.publishers !== 0 && !isStreamingUp) {
          isStreamingUp = true;
          feedbackLoopEmitter.emit(PushEventTypes.PUSH_CONNECT); // notify(STREAMING_UP) in spec
        }
      }
    },

    isStreamingUp() {
      return isStreamingUp;
    }
  };
}