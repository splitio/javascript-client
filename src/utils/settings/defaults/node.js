export default {
  startup: {
    // Stress the request time used while starting up the SDK.
    requestTimeoutBeforeReady: 15,
    // How many quick retries we will do while starting up the SDK.
    retriesOnFailureBeforeReady: 1,
    // Maximum amount of time used before notifies me a timeout.
    readyTimeout: 15,
    // Don't wait a specific time for first flush on Node, no page load here.
    eventsFirstPushWindow: 0
  },
  scheduler: {
    featuresRefreshRate: 5
  },
  features: '.split'
};
