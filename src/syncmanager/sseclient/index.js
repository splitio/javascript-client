export default class SSEClient {
  static getInstance() {
    // @TODO
  }

  // - Properties:
  // EventSource: EventSource constructor;
  // connection: EventSource | undefined;
  // handler: EventHandler for errors, messages and open events.

  constructor(EventSource) {
    this.EventSource = EventSource;
  }

  setEventHandler(handler) {
    this.handler = handler;
  }

  open(token) {
    // @TODO
    token;
  }

  close() {
    // @TODO
  }
}