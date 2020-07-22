let __isCustom = false;
let __eventSource = undefined;

// This function is only exposed for testing purposes.
export function __setEventSource(eventSource) {
  __eventSource = eventSource;
  __isCustom = true;
}
export function __restore() {
  __isCustom = false;
}

export default function getEventSource() {
  // returns EventSource at `eventsource` package or undefined
  try {
    return __isCustom ? __eventSource : require('eventsource');
    // eslint-disable-next-line no-empty
  } catch (error) { }
}