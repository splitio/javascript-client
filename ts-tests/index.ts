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

///<reference types="../types" />
import { SplitFactory } from '@splitsoftware/splitio';

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

/**** Tests for SDK interfaces ****/

// For node with sync storage
nodeSettings = {
  core: {
    authorizationKey: 'key'
  }
};
// For node with async storage
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

// Client and Manager in Node
client = SDK.client();
manager = SDK.manager();
// Today async clients are only possible on Node. Shared client creation not available here.
asyncClient = AsyncSDK.client();
asyncManager = AsyncSDK.manager();
// Browser client for attributes binding
browserClient = BrowserSDK.client();
browserClient = BrowserSDK.client('a customer key');
browserClient = BrowserSDK.client('a customer key', 'a traffic type');

/**** Tests for Client and Manager interfaces ****/

// IClient implements methods from NodeJS.Events. Testing a few.
let splitEvent: SplitIO.Event;
client = client.on(splitEvent, () => { });
const a: boolean = client.emit(splitEvent);
client = client.removeAllListeners(splitEvent);
client = client.removeAllListeners();
const b: number = client.listenerCount(splitEvent);
let nodeEventEmitter: NodeJS.EventEmitter = client;

// Traffic type can be binded or not to the Browser client.
let tracked: boolean;
tracked = browserClient.track('myTrafficType', 'myEventType'); // key binded, tt provided.
tracked = browserClient.track('myEventType'); // key and tt binded.
// Value parameter is optional on all signatures.
tracked = browserClient.track('myTrafficType', 'myEventType', 10);
tracked = browserClient.track('myEventType', 10);
// Properties parameter is optional on all signatures.
tracked = browserClient.track('myTrafficType', 'myEventType', null, { prop1: 1, prop2: '2', prop3: false, prop4: null });
tracked = browserClient.track('myEventType', undefined, { prop1: 1, prop2: '2', prop3: false, prop4: null });

// IAsyncClient implements methods from NodeJS.Events. (same as for sync client, just for interface checking)
asyncClient = asyncClient.on(splitEvent, () => { });
const a1: boolean = asyncClient.emit(splitEvent);
asyncClient = asyncClient.removeAllListeners(splitEvent);
asyncClient = asyncClient.removeAllListeners();
const b1: number = asyncClient.listenerCount(splitEvent);
nodeEventEmitter = asyncClient;

// Manager implements methods from NodeJS.Events. Testing a few.
manager = manager.on(splitEvent, () => { });
const aa: boolean = manager.emit(splitEvent);
manager = manager.removeAllListeners(splitEvent);
manager = manager.removeAllListeners();
const bb: number = manager.listenerCount(splitEvent);
nodeEventEmitter = manager;

// asyncManager implements methods from NodeJS.Events. Testing a few.
asyncManager = asyncManager.on(splitEvent, () => { });
const aaa: boolean = asyncManager.emit(splitEvent);
asyncManager = asyncManager.removeAllListeners(splitEvent);
asyncManager = asyncManager.removeAllListeners();
const bbb: number = asyncManager.listenerCount(splitEvent);
nodeEventEmitter = asyncManager;

/**** Tests for fully crowded settings interfaces ****/

// Config parameters
let nodeStorage: SplitIO.NodeSyncStorage;
let nodeAsyncStorage: SplitIO.NodeAsyncStorage;
let browserStorage: SplitIO.BrowserStorage;
let impressionListener: SplitIO.IImpressionListener;
let splitFilters: SplitIO.SplitFilter[] = [{ type: 'byName', values: ['my_split_1', 'my_split_1'] }, { type: 'byPrefix', values: ['my_split', 'test_split_'] }]

// Browser integrations
let fieldsObjectSample: UniversalAnalytics.FieldsObject = { hitType: 'event', eventAction: 'action' };
let eventDataSample: SplitIO.EventData = { eventTypeId: 'someEventTypeId', value: 10, properties: {} }

let googleAnalyticsToSplitConfig: SplitIO.IGoogleAnalyticsToSplitConfig = {
  type: 'GOOGLE_ANALYTICS_TO_SPLIT',
};
let splitToGoogleAnalyticsConfig: SplitIO.ISplitToGoogleAnalyticsConfig = {
  type: 'SPLIT_TO_GOOGLE_ANALYTICS',
};

let customGoogleAnalyticsToSplitConfig: SplitIO.IGoogleAnalyticsToSplitConfig = {
  type: 'GOOGLE_ANALYTICS_TO_SPLIT',
  hits: false,
  filter: function (model: UniversalAnalytics.Model): boolean { return true; },
  mapper: function (model: UniversalAnalytics.Model, defaultMapping: SplitIO.EventData): SplitIO.EventData { return eventDataSample; },
  prefix: 'PREFIX',
  identities: [{ key: 'key1', trafficType: 'tt1' }, { key: 'key2', trafficType: 'tt2' }],
  autoRequire: true
};
let customSplitToGoogleAnalyticsConfig: SplitIO.ISplitToGoogleAnalyticsConfig = {
  type: 'SPLIT_TO_GOOGLE_ANALYTICS',
  events: false,
  impressions: true,
  filter: function (model: SplitIO.IntegrationData): boolean { return true; },
  mapper: function (model: SplitIO.IntegrationData, defaultMapping: UniversalAnalytics.FieldsObject): UniversalAnalytics.FieldsObject { return fieldsObjectSample; },
  trackerNames: ['t0', 'myTracker'],
}

let fullBrowserSettings: SplitIO.IBrowserSettings = {
  core: {
    authorizationKey: 'api-key',
    key: 'some-key',
    trafficType: 'myTT',
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
  features: { 'feature_1': 'treatment' },
  storage: {
    type: 'LOCALSTORAGE',
    prefix: 'PREFIX'
  },
  impressionListener: impressionListener,
  debug: true,
  integrations: [googleAnalyticsToSplitConfig, splitToGoogleAnalyticsConfig, customGoogleAnalyticsToSplitConfig, customSplitToGoogleAnalyticsConfig],
  streamingEnabled: true,
  sync: {
    splitFilters: splitFilters,
    impressionsMode: 'DEBUG',
    enabled: true
  },
  userConsent: 'GRANTED'
};
fullBrowserSettings.storage.type = 'MEMORY';
fullBrowserSettings.integrations[0].type = 'GOOGLE_ANALYTICS_TO_SPLIT';
fullBrowserSettings.userConsent = 'DECLINED';
fullBrowserSettings.userConsent = 'UNKNOWN';

let fullNodeSettings: SplitIO.INodeSettings = {
  core: {
    authorizationKey: 'api-key',
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
  features: './path_to_mock.yaml',
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
    enabled: true
  }
};
fullNodeSettings.storage.type = 'MEMORY';
fullNodeSettings.mode = undefined;

let fullAsyncSettings: SplitIO.INodeAsyncSettings = {
  core: {
    authorizationKey: 'api-key',
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
  features: './path_to_mock.yaml',
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
    splitFilters: splitFilters
  }
};

// debug property can be a log level
fullBrowserSettings.debug = 'ERROR';
fullNodeSettings.debug = 'WARN';
fullAsyncSettings.debug = 'INFO';
