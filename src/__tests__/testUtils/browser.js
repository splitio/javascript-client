function triggerEvent(eventName) {
  const event = document.createEvent('HTMLEvents');
  event.initEvent(eventName, true, true);
  event.eventName = eventName;
  window.dispatchEvent(event);
}

// Util method to trigger 'unload' DOM event
export function triggerUnloadEvent() {
  triggerEvent('unload');
}

export function triggerPagehideEvent() {
  triggerEvent('pagehide');
}

export function triggerVisibilitychangeHidden() {
  triggerEvent('visibilitychange');
}