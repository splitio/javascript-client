export default function getEventSource() {
  // returns EventSource at `eventsource` package or undefined
  try {
    return require('eventsource');
    // eslint-disable-next-line no-empty
  } catch (error) { }
}