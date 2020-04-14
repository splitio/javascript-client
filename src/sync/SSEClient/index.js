import getEventSource from '../../services/getEventSource';

// const CONNECTING = 0;
// const OPEN = 1;
const CLOSED = 2;

const VERSION = '1.1';

const controlMatcher = /^control_/;

export default class SSEClient {

  /**
   * Returns a SSEClient instance, or undefined if EventSource is not available.
   * @param {*} settings Split settings used to get streaming URL
   */
  static getInstance(settings) {
    const EventSource = getEventSource();
    if (EventSource)
      return new SSEClient(EventSource, settings);
  }

  // Instance properties:
  //  streamingUrl: string
  //  EventSource: EventSource constructor
  //  connection: EventSource | undefined
  //  handler: EventHandler for open, close, error and messages events
  //  authToken: Object | undefined

  constructor(EventSource, settings) {
    this.EventSource = EventSource;
    this.streamingUrl = settings.url('/sse');
  }

  setEventHandler(handler) {
    this.handler = handler;
  }

  /**
   * Open the conexion with a given authToken
   *
   * @param {Object} authToken
   * @throws {TypeError} if `authToken` is undefined
   */
  open(authToken) {
    this.close(); // it closes connection if previously opened

    this.authToken = authToken;

    const channels = JSON.parse(authToken.decodedToken['x-ably-capability']);
    const channelsQueryParam = Object.keys(channels).map(
      function (channel) {
        const params = controlMatcher.test(channel) ? '[?occupancy=metrics.publishers]' : '';
        return encodeURIComponent(params + channel);
      }
    ).join(',');
    const url = `${this.streamingUrl}?channels=${channelsQueryParam}&accessToken=${authToken.token}&v=${VERSION}`;

    this.connection = new this.EventSource(url);

    if (this.handler) { // no need to check if SSEClient is used only by PushManager
      this.connection.onopen = this.handler.handleOpen;
      this.connection.onmessage = this.handler.handleMessage;
      this.connection.onerror = this.handler.handleError;
    }
  }

  /** Close if open or connecting */
  close() {
    if (this.connection && this.connection.readyState !== CLOSED) {
      this.connection.close();
      if (this.handler) this.handler.handleClose();
    }
  }

  /**
   * Re-open the conexion with the last given authToken.
   *
   * @throws {TypeError} if `open` has not been previously called with an authToken
   */
  reopen() {
    this.open(this.authToken);
  }
}