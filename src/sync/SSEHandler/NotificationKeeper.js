import { PUSH_CONNECT, PUSH_DISCONNECT, PUSH_DISABLED, ControlTypes } from '../constants';

const CONTROL_PRI_CHANNEL_REGEX = /control_pri$/;

export default function notificationKeeperFactory(feedbackLoopEmitter) {

  let occupancyTimestamp = -1;
  let hasPublishers = true; // false if the number of publishers is equal to 0 in the last OCCUPANCY notification from CHANNEL_PRI
  let controlTimestamp = -1;
  let hasResumed = true; // false if last CONTROL event was STREAMING_PAUSED or STREAMING_DISABLED

  return {
    handleOpen() {
      feedbackLoopEmitter.emit(PUSH_CONNECT);
    },

    isStreamingUp() {
      return hasResumed && hasPublishers;
    },

    handleOccupancyEvent(publishers, channel, timestamp) {
      if (CONTROL_PRI_CHANNEL_REGEX.test(channel) && timestamp > occupancyTimestamp) {
        occupancyTimestamp = timestamp;
        if (hasResumed) {
          if (publishers === 0 && hasPublishers) {
            feedbackLoopEmitter.emit(PUSH_DISCONNECT); // notify(STREAMING_DOWN) in spec
          } else if (publishers !== 0 && !hasPublishers) {
            feedbackLoopEmitter.emit(PUSH_CONNECT); // notify(STREAMING_UP) in spec
          }
          // nothing to do when hasResumed === false:
          // streaming is already down for publishers === 0 and cannot be up for publishers !== 0
        }
        hasPublishers = publishers !== 0;
      }
    },

    handleControlEvent(controlType, channel, timestamp) {
      if (CONTROL_PRI_CHANNEL_REGEX.test(channel) && timestamp > controlTimestamp) {
        controlTimestamp = timestamp;
        if (controlType === ControlTypes.STREAMING_DISABLED) {
          feedbackLoopEmitter.emit(PUSH_DISABLED);
        } else if (hasPublishers) {
          if (controlType === ControlTypes.STREAMING_PAUSED && hasResumed) {
            feedbackLoopEmitter.emit(PUSH_DISCONNECT); // notify(STREAMING_DOWN) in spec
          } else if (controlType === ControlTypes.STREAMING_RESUMED && !hasResumed) {
            feedbackLoopEmitter.emit(PUSH_CONNECT); // notify(STREAMING_UP) in spec
          }
          // nothing to do when hasPublishers === false:
          // streaming is already down for STREAMING_PAUSED and cannot be up for STREAMING_RESUMED
        }
        hasResumed = controlType === ControlTypes.STREAMING_RESUMED;
      }
    },

  };
}