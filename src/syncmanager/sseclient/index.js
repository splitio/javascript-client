import getEventSource from '../../services/sse/getEventSource';

export default class SSEClient {
  static getInstance() {
    const EventSource = getEventSource();
    if(EventSource)
      return new SSEClient(EventSource);
  }

  // - Properties:
  // EventSource: EventSource constructor;
  // connection: EventSource | undefined;

  constructor(EventSource) {
    this.EventSource = EventSource;
  }

  open(jwt, channels) {
    // @TODO set url and options.
    const url = jwt + channels;
    const options = {};

    // @REVIEW the following wouldn't be necessary if we do things right in Push manager, i.e., if we properly close connections
    this.close();
    this.connection = new this.EventSource(url, options);
    return this.connection;
  }

  close() {
    if (this.connection) this.connection.close();
  }
}