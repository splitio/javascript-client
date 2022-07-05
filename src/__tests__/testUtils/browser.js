function triggerEvent(eventName) {
  const event = document.createEvent('HTMLEvents');
  event.initEvent(eventName, true, true);
  event.eventName = eventName;
  window.dispatchEvent(event);
}

export function triggerUnloadEvent() {
  triggerEvent('unload');
}

export function triggerPagehideEvent() {
  triggerEvent('pagehide');
}

export function triggerVisibilitychange(state = 'hidden' /* 'hidden' | 'visible' */) {
  Object.defineProperty(document, 'visibilityState', { value: state, writable: true });
  document.dispatchEvent(new Event('visibilitychange'));
}
