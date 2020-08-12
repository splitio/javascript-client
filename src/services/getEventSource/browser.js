export default function getEventSource() {
  // eslint-disable-next-line compat/compat
  return window && typeof window.EventSource === 'function' ? window.EventSource : undefined;
}