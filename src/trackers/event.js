import logFactory from '../utils/logger';
import thenable from '../utils/promise/thenable';
const log = logFactory('splitio-client:event-tracker');

function EventTracker(context) {
  const collector = context.get(context.constants.STORAGE).events;
  const integrationsManager = context.get(context.constants.INTEGRATIONS_MANAGER, true);

  function queueEventsCallback(eventData, tracked) {
    const { eventTypeId, trafficTypeName, key, value, timestamp, properties } = eventData;
    // Logging every prop would be too much.
    const msg = `event of type "${eventTypeId}" for traffic type "${trafficTypeName}". Key: ${key}. Value: ${value}. Timestamp: ${timestamp}. ${properties ? 'With properties.' : 'With no properties.'}`;

    if (tracked) {
      log.info(`Successfully qeued ${msg}`);
      // integrationsManager does not throw errors (they are internally handled by each integration module)
      if (integrationsManager) integrationsManager.handleEvent(eventData);
    } else {
      log.warn(`Failed to queue ${msg}`);
    }

    return tracked;
  }

  return {
    track: function (eventData, size) {
      const tracked = collector.track(eventData, size);

      if (thenable(tracked)) {
        return tracked.then(queueEventsCallback.bind(null, eventData));
      } else {
        return queueEventsCallback(eventData, tracked);
      }
    }
  };
}

export default EventTracker;
