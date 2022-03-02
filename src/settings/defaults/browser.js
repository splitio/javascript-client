import { packageVersion } from './version';
import { CONSENT_GRANTED } from '@splitsoftware/splitio-commons/src/utils/constants';

export const defaults = {
  startup: {
    // Stress the request time used while starting up the SDK.
    requestTimeoutBeforeReady: 5,
    // How many quick retries we will do while starting up the SDK.
    retriesOnFailureBeforeReady: 1,
    // Maximum amount of time used before notifies me a timeout.
    readyTimeout: 10,
    // Amount of time we will wait before the first push of events.
    eventsFirstPushWindow: 10
  },

  // Consent is considered granted by default
  userConsent: CONSENT_GRANTED,

  // Instance version.
  version: `javascript-${packageVersion}`,
};
