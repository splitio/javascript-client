import { PUSH_SUBSYSTEM_UP, PUSH_SUBSYSTEM_DOWN, PUSH_NONRETRYABLE_ERROR, ControlTypes } from '../constants';

const CONTROL_CHANNEL_REGEXS = [/control_pri$/, /control_sec$/];

export default function notificationKeeperFactory(feedbackLoopEmitter) {

  let occupancyTimestamps = [-1, -1]; // keep track of most recent occupancy notification timestamp per channel
  let occupancyPublishers = [true, true]; // keep track of publishers presence per channel, in order to compute `hasPublishers`
  let hasPublishers = true; // false if the number of publishers is equal to 0 in the last OCCUPANCY notification from CHANNEL_PRI
  let controlTimestamps = [-1, -1]; // keep track of most recent control notification timestamp per channel
  let hasResumed = true; // false if last CONTROL event was STREAMING_PAUSED or STREAMING_DISABLED

  function getHasPublishers() { // computes the value of `hasPublishers`
    return occupancyPublishers.some(hasPublishers => hasPublishers);
  }

  return {
    handleOpen() {
      feedbackLoopEmitter.emit(PUSH_SUBSYSTEM_UP);
    },

    isStreamingUp() {
      return hasResumed && hasPublishers;
    },

    handleOccupancyEvent(publishers, channel, timestamp) {
      CONTROL_CHANNEL_REGEXS.some((regex, index) => {
        if (regex.test(channel) && timestamp > occupancyTimestamps[index]) {
          occupancyTimestamps[index] = timestamp;
          occupancyPublishers[index] = publishers !== 0;
          const newHasPublishers = getHasPublishers();
          if (hasResumed) {
            if (!newHasPublishers && hasPublishers) {
              feedbackLoopEmitter.emit(PUSH_SUBSYSTEM_DOWN);
            } else if (newHasPublishers && !hasPublishers) {
              feedbackLoopEmitter.emit(PUSH_SUBSYSTEM_UP);
            }
            // nothing to do when hasResumed === false:
            // streaming is already down for `!newHasPublishers`, and cannot be up for `newHasPublishers`
          }
          hasPublishers = newHasPublishers;
        }
      });
    },

    handleControlEvent(controlType, channel, timestamp) {
      CONTROL_CHANNEL_REGEXS.some((regex, index) => {
        if (regex.test(channel) && timestamp > controlTimestamps[index]) {
          controlTimestamps[index] = timestamp;
          if (controlType === ControlTypes.STREAMING_DISABLED) {
            feedbackLoopEmitter.emit(PUSH_NONRETRYABLE_ERROR);
          } else if (hasPublishers) {
            if (controlType === ControlTypes.STREAMING_PAUSED && hasResumed) {
              feedbackLoopEmitter.emit(PUSH_SUBSYSTEM_DOWN);
            } else if (controlType === ControlTypes.STREAMING_RESUMED && !hasResumed) {
              feedbackLoopEmitter.emit(PUSH_SUBSYSTEM_UP);
            }
            // nothing to do when hasPublishers === false:
            // streaming is already down for `STREAMING_PAUSED`, and cannot be up for `STREAMING_RESUMED`
          }
          hasResumed = controlType === ControlTypes.STREAMING_RESUMED;
        }
      });
    },

  };
}