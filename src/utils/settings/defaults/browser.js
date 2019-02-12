export default {
  startup: {
    // Stress the request time used while starting up the SDK.
    requestTimeoutBeforeReady: 1.5,
    // How many quick retries we will do while starting up the SDK.
    retriesOnFailureBeforeReady: 1,
    // Maximum amount of time used before notifies me a timeout.
    readyTimeout: 1.5,
    // Amount of time we will wait before the first push of events.
    eventsFirstPushWindow: 10
  }
};
