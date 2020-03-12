import getEventSource from '../../services/sse/getEventSource';

// const CONNECTING = 0;
// const OPEN = 1;
const CLOSED = 2;

const BASE_URL = 'https://realtime.ably.io/event-stream';
const VERSION = '1.1';

export default class SSEClient {
  static getInstance() {
    const EventSource = getEventSource();
    if (EventSource)
      return new SSEClient(EventSource);
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

  open({ token, decodedToken }) {
    // @REVIEW we can maybe remove next line, if we are properly calling sseClient.close() from Push manager
    this.close();

    // @TODO test and add error handling
    const channels = JSON.parse(decodedToken['x-ably-capability']);
    const channelsQueryParam = Object.keys(channels).join(',');
    const url = `${BASE_URL}?channels=${channelsQueryParam}&accessToken=${token}&v=${VERSION}`;
    // url for testing
    // const url = `${BASE_URL}?channels=${channels}&key=${jwt}&v=${VERSION}`;

    // @TOTO set options
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