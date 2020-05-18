import logFactory from '../utils/logger';
const log = logFactory('splitio-events');
import tracker from '../utils/timeTracker';
import repeat from '../utils/fn/repeat';
import eventsService from '../services/events';
import eventsBulkRequest from '../services/events/bulk';

const EventsFactory = context => {
  const settings = context.get(context.constants.SETTINGS);
  const storage = context.get(context.constants.STORAGE);

  const pushEvents = () => {
    if (storage.events.isEmpty()) return Promise.resolve();

    log.info(`Pushing ${storage.events.state().length} queued events.`);
    const latencyTrackerStop = tracker.start(tracker.TaskNames.EVENTS_PUSH);
    const json = JSON.stringify(storage.events.toJSON());
    const wrapUpCb = () => latencyTrackerStop();
    storage.events.clear(); // we always clear the queue.

    return eventsService(eventsBulkRequest(settings, {
      body: json
    })).then(wrapUpCb).catch(wrapUpCb);
  };

  let stopEventPublisherTimeout = false;
  let stopEventsPublisher = false;
  const startEventsPublisher = () =>
    stopEventsPublisher = repeat(
      schedulePublisher => pushEvents().then(() => schedulePublisher()),
      settings.scheduler.eventsPushRate
    );

  return {
    start() {
      // On the browser there may be a wish to wait an specific amount of seconds before the first push.
      if (settings.startup.eventsFirstPushWindow > 0) {
        stopEventPublisherTimeout = setTimeout(startEventsPublisher, settings.startup.eventsFirstPushWindow);
      } else {
        startEventsPublisher();
      }
    },

    flush() {
      return pushEvents();
    },

    stop() {
      stopEventPublisherTimeout && clearTimeout(stopEventPublisherTimeout);
      stopEventsPublisher && stopEventsPublisher();
    },

    flushAndResetTimer() {
      // Reset the timer and push the events.
      log.info('Flushing events and reseting timer.');
      stopEventsPublisher && stopEventsPublisher.reset();
      return pushEvents();
    }
  };
};

export default EventsFactory;
