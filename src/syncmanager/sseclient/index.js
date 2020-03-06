import getEventSource from '../../services/sse/getEventSource';

// const CONNECTING = 0;
// const OPEN = 1;
const CLOSED = 2;

export default class SSEClient {
  static getInstance() {
    const EventSource = getEventSource();
    if (EventSource)
      return new SSEClient(EventSource);
  }

  // - Properties:
  // EventSource: EventSource constructor;
  // connection: EventSource | undefined;

  constructor(EventSource) {
    this.EventSource = EventSource;
  }

  setEventListener(listener) {
    this.listener = listener;
  }

  open(jwt, channels) {
    // @REVIEW we can maybe remove next line, if we are properly calling sseClient.close() from Push manager
    this.close();

    // @TODO set url and options.
    const url = jwt + channels;
    const options = {};
    this.connection = new this.EventSource(url, options);

    if (this.listener) { // no need to check if SSEClient is used only by PushManager
      this.connection.onopen = this.listener.handleOpen;
      this.connection.onmessage = this.listener.handleMessage;
      this.connection.onerror = this.listener.handleError;
    }
  }

  close() {
    if (this.connection && this.connection.readyState === CLOSED) {
      this.connection.close();
      if (this.listener) this.listener.handleClose();
    }
  }
}