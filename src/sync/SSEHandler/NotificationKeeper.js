import { PushEventTypes, ControlTypes } from '../constants';

const controlPriMatcher = /control_pri$/;

export default function notificationKeeperFactory(feedbackLoopEmitter) {

  let isStreamingUp;

  return {
    handleOpen() {
      isStreamingUp = true;
      feedbackLoopEmitter.emit(PushEventTypes.PUSH_CONNECT);
    },

    handleOccupancyEvent(parsedData, channel) {
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

    handleControlEvent(parsedData, channel) {
      if (controlPriMatcher.test(channel)) {
        if(parsedData.controlType === ControlTypes.STREAMING_PAUSED && isStreamingUp) {
          isStreamingUp = false;
          feedbackLoopEmitter.emit(PushEventTypes.PUSH_DISCONNECT); // notify(STREAMING_DOWN) in spec
        }
        if(parsedData.controlType === ControlTypes.STREAMING_RESUMED && !isStreamingUp) {
          isStreamingUp = true;
          feedbackLoopEmitter.emit(PushEventTypes.PUSH_CONNECT); // notify(STREAMING_UP) in spec
        }
        if(parsedData.controlType === ControlTypes.STREAMING_DISABLED) {
          isStreamingUp = false;
          feedbackLoopEmitter.emit(PushEventTypes.PUSH_DISABLED);
        }
      }
    },

    isStreamingUp() {
      return isStreamingUp;
    }
  };
}