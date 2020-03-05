export default function getEventSource() {
  return typeof this.EventSource === 'function' ? this.EventSource : undefined;
}