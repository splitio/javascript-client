import objectAssign from 'object-assign';
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
      log.info(`Successfully queued ${msg}`);
      if (integrationsManager) {
        // Wrap in a timeout because we don't want it to be blocking.
        setTimeout(function () {
          // copy of event, to avoid unexpected behaviour if modified by integrations
          const eventDataCopy = objectAssign({}, eventData);
          if (eventData.properties) eventDataCopy.properties = objectAssign({}, eventData.properties);
          // integrationsManager does not throw errors (they are internally handled by each integration module)
          integrationsManager.handleEvent(eventDataCopy);
        }, 0);
      }
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
