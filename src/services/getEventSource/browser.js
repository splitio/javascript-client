export default function getEventSource() {
  return window && typeof window.EventSource === 'function' ? window.EventSource : undefined;
}