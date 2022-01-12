// Util method to trigger 'unload' DOM event
export function triggerUnloadEvent() {
  const event = document.createEvent('HTMLEvents');
  event.initEvent('unload', true, true);
  event.eventName = 'unload';
  window.dispatchEvent(event);
}
