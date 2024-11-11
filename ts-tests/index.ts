/**
 * Split software typescript declarations testing.
 *
 * This file is not meant to run but to be compiled without errors. This is the same way to test .d.ts files
 * that you will need to comply to publish packages on @types organization on NPM (DefinitelyTyped).
 * We import the declarations through the NPM package name (using the development branch of the repo)
 * to test in the same way in which customers will be using it on development.
 *
 * The step of compiling this file is part of the continous integration systems in place.
 *
 * @author Nico Zelaya <nicolas.zelaya@split.io>
 */

import type * as SplitTypes from '../types/splitio';

import { SplitFactory } from '../types/index';
import { SplitFactory as SplitFactoryCS } from '../types/client';
import { SplitFactory as SplitFactorySS } from '../types/server';

// Validate that the SplitIO namespace is available and matches the types when imported explicitly
let ambientType: SplitIO.ISDK;
let importedType: SplitTypes.ISDK;
ambientType = importedType;

/**** Interfaces ****/

// Facade return interface
let SDK: SplitIO.ISDK;
let AsyncSDK: SplitIO.IAsyncSDK;
let BrowserSDK: SplitIO.IBrowserSDK;
// Settings interfaces
let nodeSettings: SplitIO.INodeSettings;
let nodeAsyncSettings: SplitIO.INodeAsyncSettings;
let browserSettings: SplitIO.IBrowserSettings;
// Client & Manager APIs
let client: SplitIO.IClient;
let manager: SplitIO.IManager;
let asyncClient: SplitIO.IAsyncClient;
let asyncManager: SplitIO.IAsyncManager;
let browserClient: SplitIO.IBrowserClient;
// Utility interfaces
let impressionListener: SplitIO.IImpressionListener;
// Mocks
let mockedFeaturesPath: SplitIO.MockedFeaturesFilePath;
let mockedFeaturesMap: SplitIO.MockedFeaturesMap;

/**** Tests for SDK interfaces ****/

// For Node.js with sync storage
nodeSettings = {
  core: {
    authorizationKey: 'key'
  }
};
// For Node.js with async storage
nodeAsyncSettings = {
  core: {
    authorizationKey: 'key'
  },
  mode: 'consumer',
  storage: {
    type: 'REDIS'
  }
};
// For browser
browserSettings = {
  core: {
    authorizationKey: 'another-key',
    key: 'customer-key'
  }
};
// With sync settings should return ISDK, if settings have async storage it should return IAsyncSDK
SDK = SplitFactory(nodeSettings);
AsyncSDK = SplitFactory(nodeAsyncSettings);
BrowserSDK = SplitFactory(browserSettings);
SDK = SplitFactorySS(nodeSettings);
AsyncSDK = SplitFactorySS(nodeAsyncSettings);
BrowserSDK = SplitFactoryCS(browserSettings);

// Client and Manager
client = SDK.client();
manager = SDK.manager();
manager = BrowserSDK.manager();
// Today async clients are only possible on Node.js. Shared client creation not available here.
asyncClient = AsyncSDK.client();
asyncManager = AsyncSDK.manager();
// Browser client for attributes binding
browserClient = BrowserSDK.client();
browserClient = BrowserSDK.client('a customer key');

/**** Tests for Client and Manager interfaces ****/

let splitKey: SplitIO.SplitKey = 'someKey';
let tracked: boolean;
tracked = client.track(splitKey, 'myTrafficType', 'myEventType'); // all params
tracked = browserClient.track('myTrafficType', 'myEventType'); // key bound, tt provided.
// Value parameter is optional on all signatures.
tracked = client.track(splitKey, 'myTrafficType', 'myEventType', 10);
tracked = browserClient.track('myTrafficType', 'myEventType', 10);
// Properties parameter is optional on all signatures.
tracked = client.track(splitKey, 'myTrafficType', 'myEventType', 10, { prop1: 1, prop2: '2', prop3: false, prop4: null });
tracked = browserClient.track('myTrafficType', 'myEventType', undefined, { prop1: 1, prop2: '2', prop3: false, prop4: null });


/**** Tests for fully crowded settings interfaces ****/

// Split filters
let splitFilters: SplitIO.SplitFilter[] = [{ type: 'bySet', values: ['set_a', 'set_b'] }, { type: 'byName', values: ['my_split_1', 'my_split_1'] }, { type: 'byPrefix', values: ['my_split', 'test_split_'] }]

let fullBrowserSettings: SplitIO.IBrowserSettings = {
  core: {
    authorizationKey: 'sdk-key',
    key: 'some-key',
    labelsEnabled: false
  },
  scheduler: {
    featuresRefreshRate: 1,
    impressionsRefreshRate: 1,
    impressionsQueueSize: 1,
    metricsRefreshRate: 1,
    telemetryRefreshRate: 1,
    segmentsRefreshRate: 1,
    offlineRefreshRate: 1,
    eventsPushRate: 1,
    eventsQueueSize: 1,
    pushRetryBackoffBase: 1
  },
  startup: {
    readyTimeout: 1,
    requestTimeoutBeforeReady: 1,
    retriesOnFailureBeforeReady: 1,
    eventsFirstPushWindow: 1
  },
  urls: {
    sdk: 'https://asd.com/sdk',
    events: 'https://asd.com/events',
    auth: 'https://asd.com/auth',
    streaming: 'https://asd.com/streaming',
    telemetry: 'https://asd.com/telemetry'
  },
  features: mockedFeaturesMap,
  storage: {
    type: 'LOCALSTORAGE',
    prefix: 'PREFIX'
  },
  impressionListener: impressionListener,
  debug: true,
  streamingEnabled: true,
  sync: {
    splitFilters: splitFilters,
    impressionsMode: 'DEBUG',
    enabled: true,
    requestOptions: {
      getHeaderOverrides(context) { return { ...context.headers, 'header': 'value' } },
    }
  },
  userConsent: 'GRANTED'
};
fullBrowserSettings.storage.type = 'MEMORY';
fullBrowserSettings.userConsent = 'DECLINED';
fullBrowserSettings.userConsent = 'UNKNOWN';

let fullNodeSettings: SplitIO.INodeSettings = {
  core: {
    authorizationKey: 'sdk-key',
    labelsEnabled: false,
    IPAddressesEnabled: false
  },
  scheduler: {
    featuresRefreshRate: 1,
    impressionsRefreshRate: 1,
    impressionsQueueSize: 1,
    metricsRefreshRate: 1,
    telemetryRefreshRate: 1,
    segmentsRefreshRate: 1,
    offlineRefreshRate: 1,
    eventsPushRate: 1,
    eventsQueueSize: 1,
    pushRetryBackoffBase: 1
  },
  startup: {
    readyTimeout: 1,
    requestTimeoutBeforeReady: 1,
    retriesOnFailureBeforeReady: 1,
    eventsFirstPushWindow: 1
  },
  urls: {
    sdk: 'https://asd.com/sdk',
    events: 'https://asd.com/events',
    auth: 'https://asd.com/auth',
    streaming: 'https://asd.com/streaming',
    telemetry: 'https://asd.com/telemetry'
  },
  features: mockedFeaturesPath,
  storage: {
    type: 'MEMORY'
  },
  impressionListener: impressionListener,
  mode: 'standalone',
  debug: false,
  streamingEnabled: false,
  sync: {
    splitFilters: splitFilters,
    impressionsMode: 'OPTIMIZED',
    enabled: true,
    requestOptions: {
      getHeaderOverrides(context) { return { ...context.headers, 'header': 'value' } },
      agent: new (require('https')).Agent(),
    }
  }
};
fullNodeSettings.storage.type = 'MEMORY';
fullNodeSettings.mode = undefined;

let fullAsyncSettings: SplitIO.INodeAsyncSettings = {
  core: {
    authorizationKey: 'sdk-key',
    labelsEnabled: false,
    IPAddressesEnabled: false
  },
  scheduler: {
    featuresRefreshRate: 1,
    impressionsRefreshRate: 1,
    impressionsQueueSize: 1,
    metricsRefreshRate: 1,
    telemetryRefreshRate: 1,
    segmentsRefreshRate: 1,
    offlineRefreshRate: 1,
    eventsPushRate: 1,
    eventsQueueSize: 1
  },
  startup: {
    readyTimeout: 1,
    requestTimeoutBeforeReady: 1,
    retriesOnFailureBeforeReady: 1
  },
  features: mockedFeaturesPath,
  storage: {
    type: 'REDIS',
    options: {
      url: 'url',
      host: 'host',
      port: 1234,
      db: 0,
      pass: 'pass',
      connectionTimeout: 100,
      operationTimeout: 100,
      tls: { ca: ['ca'] }
    },
    prefix: 'PREFIX'
  },
  impressionListener: impressionListener,
  mode: 'consumer',
  debug: true,
  sync: {
    splitFilters: splitFilters,
    impressionsMode: 'DEBUG',
  }
};

// debug property can be a log level
fullBrowserSettings.debug = 'ERROR';
fullNodeSettings.debug = 'WARN';
fullAsyncSettings.debug = 'INFO';
