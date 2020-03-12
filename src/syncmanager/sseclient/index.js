export default class SSEClient {
  static getInstance() {
    // @TODO
  }

  // - Properties:
  // EventSource: EventSource constructor;
  // connection: EventSource | undefined;
  // listener: EventHandler for errors, messages and open events.

  constructor(EventSource) {
    this.EventSource = EventSource;
  }

  setEventListener(listener) {
    this.listener = listener;
  }

  open(token) {
    // @TODO
    token;
  }

  close() {
    // @TODO
  }
}