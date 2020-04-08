let __eventSource = undefined;

// This function is only exposed for testing purposses.
export function __setEventSource(eventSource) {
  __eventSource = eventSource;
}

export default function getEventSource() {
  // returns EventSource at `eventsource` package or undefined
  try {
    return __eventSource || require('eventsource');
    // eslint-disable-next-line no-empty
  } catch (error) { }
}