import getEventSource from '../../services/getEventSource';

const VERSION = '1.1';

const CONTROL_CHANNEL_REGEX = /^control_/;

/**
 * Build metadata headers for SSE connection.
 *
 * @param {Object} settings Validated settings.
 */
function buildSSEHeaders(settings) {
  const headers = {
    SplitSDKClientKey: settings.core.authorizationKey.slice(-4),
    SplitSDKVersion: settings.version,
  };

  // ip and hostname are false if IPAddressesEnabled is false
  const { ip, hostname } = settings.runtime;
  if (ip) headers['SplitSDKMachineIP'] = ip;
  if (hostname) headers['SplitSDKMachineName'] = hostname;

  return headers;
}

export default class SSEClient {

  /**
   * Returns a SSEClient instance, or undefined if EventSource is not available.
   * @param {Object} settings Validated SDK settings.
   * @param {boolean} useHeaders True for Node and false for Browser, used to send metadata as headers or query params respectively.
   */
  static getInstance(settings, useHeaders) {
    const EventSource = getEventSource();
    if (EventSource)
      return new SSEClient(EventSource, settings, useHeaders);
  }

  // Instance properties:
  //  streamingUrl: string
  //  EventSource: EventSource constructor
  //  connection: EventSource | undefined
  //  handler: EventHandler for open, close, error and messages events

  constructor(EventSource, settings, useHeaders) {
    this.EventSource = EventSource;
    this.streamingUrl = settings.url('/sse');
    this.useHeaders = useHeaders;
    this.headers = buildSSEHeaders(settings);
  }

  setEventHandler(handler) {
    this.handler = handler;
  }

  /**
   * Open the connection with a given authToken
   *
   * @param {Object} authToken
   * @throws {TypeError} Will throw an error if `authToken` is undefined
   */
  open(authToken) {
    this.close(); // it closes connection if previously opened

    const channelsQueryParam = Object.keys(authToken.channels).map(
      function (channel) {
        const params = CONTROL_CHANNEL_REGEX.test(channel) ? '[?occupancy=metrics.publishers]' : '';
        return encodeURIComponent(params + channel);
      }
    ).join(',');
    const url = `${this.streamingUrl}?channels=${channelsQueryParam}&accessToken=${authToken.token}&v=${VERSION}&heartbeats=true`; // same results using `&heartbeats=false`

    this.connection = new this.EventSource(
      // For Browser, SplitSDKClientKey and SplitSDKClientKey headers are passed as query params,
      // because native EventSource implementations for browser doesn't support headers.
      this.useHeaders ? url : url + `&SplitSDKVersion=${this.headers.SplitSDKVersion}&SplitSDKClientKey=${this.headers.SplitSDKClientKey}`,
      // For Node, metadata headers are passed because 'eventsource' package supports them.
      this.useHeaders ? { headers: this.headers } : undefined
    );

    if (this.handler) { // no need to check if SSEClient is used only by PushManager
      this.connection.onopen = this.handler.handleOpen;
      this.connection.onmessage = this.handler.handleMessage;
      this.connection.onerror = this.handler.handleError;
    }
  }

  /** Close connection  */
  close() {
    if (this.connection) this.connection.close();
  }
}