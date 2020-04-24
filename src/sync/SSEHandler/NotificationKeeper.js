import { PUSH_CONNECT, PUSH_DISCONNECT, PUSH_DISABLED, ControlTypes } from '../constants';

const CONTROL_PRI_CHANNEL_REGEX = /control_pri$/;

export default function notificationKeeperFactory(feedbackLoopEmitter) {

  let isStreamingUp = false;
  let occupancyTimestamp = -1;
  let controlTimestamp = -1;

  return {
    handleOpen() {
      isStreamingUp = true;
      feedbackLoopEmitter.emit(PUSH_CONNECT);
    },

    handleOccupancyEvent(publishers, channel, timestamp) {
      if (CONTROL_PRI_CHANNEL_REGEX.test(channel) && timestamp > occupancyTimestamp) {
        occupancyTimestamp = timestamp;
        if (publishers === 0 && isStreamingUp) {
          isStreamingUp = false;
          feedbackLoopEmitter.emit(PUSH_DISCONNECT); // notify(STREAMING_DOWN) in spec
          return;
        }
        if (publishers !== 0 && !isStreamingUp) {
          isStreamingUp = true;
          feedbackLoopEmitter.emit(PUSH_CONNECT); // notify(STREAMING_UP) in spec
        }
      }
    },

    handleControlEvent(controlType, channel, timestamp) {
      if (CONTROL_PRI_CHANNEL_REGEX.test(channel) && timestamp > controlTimestamp) {
        controlTimestamp = timestamp;
        if (controlType === ControlTypes.STREAMING_PAUSED && isStreamingUp) {
          isStreamingUp = false;
          feedbackLoopEmitter.emit(PUSH_DISCONNECT); // notify(STREAMING_DOWN) in spec
          return;
        }
        if (controlType === ControlTypes.STREAMING_RESUMED && !isStreamingUp) {
          isStreamingUp = true;
          feedbackLoopEmitter.emit(PUSH_CONNECT); // notify(STREAMING_UP) in spec
          return;
        }
        if (controlType === ControlTypes.STREAMING_DISABLED) {
          isStreamingUp = false;
          feedbackLoopEmitter.emit(PUSH_DISABLED);
        }
      }
    },

    isStreamingUp() {
      return isStreamingUp;
    }
  };
}