import logFactory from '../utils/logger';
import thenable from '../utils/promise/thenable';
const log = logFactory('splitio-client:event-tracker');

function queueEventsCallback({
  eventTypeId, trafficTypeName, key, value, timestamp, properties
}, tracked) {
  // Logging every prop would be too much.
  const msg = `event of type "${eventTypeId}" for traffic type "${trafficTypeName}". Key: ${key}. Value: ${value}. Timestamp: ${timestamp}. ${properties ? 'With properties.' : 'With no properties.'}`;

  if (tracked) {
    log.info(`Successfully qeued ${msg}`);
  } else {
    log.warn(`Failed to queue ${msg}`);
  }

  return tracked;
}

function EventTracker(context) {
  const storage = context.get(context.constants.STORAGE);

  return {
    track: function(eventData, size) {
      const tracked = storage.events.track(eventData, size);

      if (thenable(tracked)) {
        return tracked.then(queueEventsCallback.bind(null, eventData));
      } else {
        return queueEventsCallback(eventData, tracked);
      }
    }
  };
}

export default EventTracker;
