export default function getEventSource(modulePath = 'eventsource') {
  let EventSource = undefined;
  try {
    EventSource = require(modulePath);
    // eslint-disable-next-line no-empty
  } catch (error) { }
  return EventSource;
}