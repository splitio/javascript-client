import { PUSH_SUBSYSTEM_UP, PUSH_SUBSYSTEM_DOWN, PUSH_NONRETRYABLE_ERROR, ControlTypes } from '../constants';

const CONTROL_CHANNEL_REGEXS = [/control_pri$/, /control_sec$/];

export default function notificationKeeperFactory(feedbackLoopEmitter) {

  let channels = CONTROL_CHANNEL_REGEXS.map(regex => ({
    regex,
    hasPublishers: true, // keep track of publishers presence per channel, in order to compute `hasPublishers`. Init with true, to emit PUSH_SUBSYSTEM_UP if initial OCCUPANCY notifications have 0 publishers
    oTime: -1, // keep track of most recent occupancy notification timestamp per channel
    cTime: -1 // keep track of most recent control notification timestamp per channel
  }));

  // false if the number of publishers is equal to 0 in all regions
  let hasPublishers = true;

  // false if last CONTROL event was STREAMING_PAUSED or STREAMING_DISABLED
  let hasResumed = true;

  function getHasPublishers() { // computes the value of `hasPublishers`
    return channels.some(c => c.hasPublishers);
  }

  return {
    handleOpen() {
      feedbackLoopEmitter.emit(PUSH_SUBSYSTEM_UP);
    },

    isStreamingUp() {
      return hasResumed && hasPublishers;
    },

    handleOccupancyEvent(publishers, channel, timestamp) {
      for (let i = 0; i < channels.length; i++) {
        const c = channels[i];
        if (c.regex.test(channel)) {
          if (timestamp > c.oTime) {
            c.oTime = timestamp;
            c.hasPublishers = publishers !== 0;
            const hasPublishersNow = getHasPublishers();
            if (hasResumed) {
              if (!hasPublishersNow && hasPublishers) {
                feedbackLoopEmitter.emit(PUSH_SUBSYSTEM_DOWN);
              } else if (hasPublishersNow && !hasPublishers) {
                feedbackLoopEmitter.emit(PUSH_SUBSYSTEM_UP);
              }
              // nothing to do when hasResumed === false:
              // streaming is already down for `!hasPublishersNow`, and cannot be up for `hasPublishersNow`
            }
            hasPublishers = hasPublishersNow;
          }
          return;
        }
      }
    },

    handleControlEvent(controlType, channel, timestamp) {
      /* STREAMING_RESET event is handled by PushManager directly since it doesn't require
       * tracking timestamp and state like OCCUPANCY or CONTROL. It also ignores previous
       * OCCUPANCY and CONTROL notifications, and whether PUSH_SUBSYSTEM_DOWN has been emitted or not */
      if (controlType === ControlTypes.STREAMING_RESET) {
        feedbackLoopEmitter.emit(controlType);
        return;
      }

      for (let i = 0; i < channels.length; i++) {
        const c = channels[i];
        if (c.regex.test(channel)) {
          if (timestamp > c.cTime) {
            c.cTime = timestamp;
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
          return;
        }
      }
    },

  };
}