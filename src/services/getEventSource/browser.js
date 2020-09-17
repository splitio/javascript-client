export default function getEventSource() {
  // eslint-disable-next-line compat/compat
  return typeof window !== 'undefined' && typeof window.EventSource === 'function' ? window.EventSource : undefined;
}