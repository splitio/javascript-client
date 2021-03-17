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

import { SplitFactory } from '@splitsoftware/splitio';

let stringPromise: Promise<string>;
let splitNamesPromise: Promise<SplitIO.SplitNames>;
let splitViewPromise: Promise<SplitIO.SplitView>;
let splitViewsPromise: Promise<SplitIO.SplitViews>;
let treatmentsPromise: Promise<SplitIO.Treatments>;
let treatmentWithConfigPromise: Promise<SplitIO.TreatmentWithConfig>;
let treatmentsWithConfigPromise: Promise<SplitIO.TreatmentsWithConfig>;
let trackPromise: Promise<boolean>;

/**** Interfaces ****/

// Facade return interface
let SDK: SplitIO.ISDK;
let AsyncSDK: SplitIO.IAsyncSDK;
// Settings interfaces
let nodeSettings: SplitIO.INodeSettings;
let asyncSettings: SplitIO.INodeAsyncSettings;
let browserSettings: SplitIO.IBrowserSettings;
// Client & Manager APIs
let client: SplitIO.IClient;
let manager: SplitIO.IManager;
let asyncClient: SplitIO.IAsyncClient;
let asyncManager: SplitIO.IAsyncManager;
// Utility interfaces
let impressionListener: SplitIO.IImpressionListener;

/**** Custom Types ****/

// Common
let treatment: SplitIO.Treatment = 'on';
let treatmentWithConfig: SplitIO.TreatmentWithConfig = {
  treatment: 'control',
  config: null
};
treatmentWithConfig = { treatment: 'off', config: '{}' };
let asyncTreatment: SplitIO.AsyncTreatment = stringPromise;
let asyncTreatmentWithConfig: SplitIO.AsyncTreatmentWithConfig = treatmentWithConfigPromise;
let tracked: boolean;
let treatmentsMap: SplitIO.Treatments = {
  feature1: 'on',
  feature2: 'control'
};
let treatmentsWithConfigMap: SplitIO.TreatmentsWithConfig = {
  feature1: { treatment: 'control', config: null },
  feature2: { treatment: 'off', config: '{"color":"blue"}' }
};
let treatments: SplitIO.Treatments = treatmentsMap;
let treatmentsWithConfig: SplitIO.TreatmentsWithConfig = treatmentsWithConfigMap;
let asyncTreatments: SplitIO.AsyncTreatments = treatmentsPromise;
let asyncTreatmentsWithConfig: SplitIO.AsyncTreatmentsWithConfig = treatmentsWithConfigPromise;
let splitEvent: SplitIO.Event;
const attributes: SplitIO.Attributes = {
  attr1: 1,
  attr2: '2',
  attr3: Date.now(),
  attr4: ['str1', 2],
  attr5: ['str1', 'str2'],
  attr6: [1, 2],
  attr7: true
};
const splitKeyObj: SplitIO.SplitKeyObject = {
  matchingKey: 'matchingKey',
  bucketingKey: 'bucketingKey'
};
let splitKey: SplitIO.SplitKey;
// Mocks
let mockedFeaturesPath: SplitIO.MockedFeaturesFilePath;
let mockedFeaturesMap: SplitIO.MockedFeaturesMap;
// Split Data
let splitView: SplitIO.SplitView;
let splitViews: SplitIO.SplitViews;
let splitNames: SplitIO.SplitNames;
let splitNamesAsync: SplitIO.SplitNamesAsync;
let splitViewAsync: SplitIO.SplitViewAsync;
let splitViewsAsync: SplitIO.SplitViewsAsync;
// Impression data
let impressionData: SplitIO.ImpressionData;
// Storages
let nodeStorage: SplitIO.NodeSyncStorage;
let nodeAsyncStorage: SplitIO.NodeAsyncStorage;
let browserStorage: SplitIO.BrowserStorage;

mockedFeaturesPath = 'path/to/file';
mockedFeaturesMap = {
  feature1: 'treatment',
  feature2: { treatment: 'treatment2', config: "{ 'prop': 'value'}" },
  feature3: { treatment: 'treatment3', config: null }
};

// Treatment can be the string or the promise which will resolve to treatment string
treatment = 'some treatment';  // Sync case
asyncTreatment = stringPromise;  // Async case

// Treatments can be the object or the promise which will resolve to treatments object
treatments = {
  someFeature: 'treatment'
}; // Sync
asyncTreatments = treatmentsPromise;  // Async

// SplitViews can be the SplitViewData or the promise which will resolve to SplitViewData obj
splitView = {
  name: 'asd',
  killed: false,
  trafficType: 'user',
  treatments: ['on', 'off'],
  changeNumber: 18294,
  configs: {
    off: '{"dimensions":"{\"height\":20,\"width\":40}"}'
  }
};
splitViews = [splitView];

splitViewAsync = splitViewPromise;
splitNamesAsync = splitNamesPromise;
splitViewsAsync = splitViewsPromise;

// Split key could be a split key object or a string
splitKey = 'someKey';
splitKey = splitKeyObj;

/**** Tests for ISDK interface ****/

// For node with sync storage
nodeSettings = {
  core: {
    authorizationKey: 'key'
  }
};
// For node with async storage
asyncSettings = {
  core: {
    authorizationKey: 'key'
  },
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
SDK = SplitFactory(browserSettings);
SDK = SplitFactory(nodeSettings);
AsyncSDK = SplitFactory(asyncSettings);

// The settings values the SDK expose.
const instantiatedSettingsCore: {
  authorizationKey: string,
  key: SplitIO.SplitKey,
  trafficType: string,
  labelsEnabled: boolean,
  IPAddressesEnabled: boolean
} = SDK.settings.core;
const instantiatedSettingsMode: ('standalone' | 'consumer') = SDK.settings.mode;
const instantiatedSettingsScheduler: {[key: string]: number} = SDK.settings.scheduler;
const instantiatedSettingsStartup: {[key: string]: number} = SDK.settings.startup;
const instantiatedSettingsStorage: {
  prefix: string,
  options: Object,
  // It can have any of the storages.
  type: SplitIO.NodeSyncStorage | SplitIO.NodeAsyncStorage | SplitIO.BrowserStorage
} = SDK.settings.storage;
const instantiatedSettingsUrls: {[key: string]: string} = SDK.settings.urls;
const instantiatedSettingsVersion: string = SDK.settings.version;
let instantiatedSettingsFeatures: {[key: string]: string} = SDK.settings.features;
// We should be able to write on features prop. The rest are readonly props.
instantiatedSettingsFeatures.something = 'something';

// Client and Manager
client = SDK.client();
client = SDK.client('a customer key');
client = SDK.client('a customer key', 'a traffic type');
manager = SDK.manager();
// Today async clients are only possible on Node. Shared client creation not available here.
asyncClient = AsyncSDK.client();
asyncManager = AsyncSDK.manager();

// Logger
SDK.Logger.enable();
SDK.Logger.setLogLevel(SDK.Logger.LogLevel.DEBUG);
SDK.Logger.setLogLevel(SDK.Logger.LogLevel.INFO);
SDK.Logger.setLogLevel(SDK.Logger.LogLevel.WARN);
SDK.Logger.setLogLevel(SDK.Logger.LogLevel.ERROR);
SDK.Logger.setLogLevel(SDK.Logger.LogLevel.NONE);
SDK.Logger.disable();

AsyncSDK.Logger.enable();
AsyncSDK.Logger.setLogLevel(AsyncSDK.Logger.LogLevel.DEBUG);
AsyncSDK.Logger.setLogLevel(AsyncSDK.Logger.LogLevel.INFO);
AsyncSDK.Logger.setLogLevel(AsyncSDK.Logger.LogLevel.WARN);
AsyncSDK.Logger.setLogLevel(AsyncSDK.Logger.LogLevel.ERROR);
AsyncSDK.Logger.setLogLevel(AsyncSDK.Logger.LogLevel.NONE);
AsyncSDK.Logger.disable();

/**** Tests for IClient interface ****/

// Events constants we get
const eventConsts: {[key: string]: SplitIO.Event} = client.Event;
splitEvent = client.Event.SDK_READY;
splitEvent = client.Event.SDK_READY_FROM_CACHE;
splitEvent = client.Event.SDK_READY_TIMED_OUT;
splitEvent = client.Event.SDK_UPDATE;

// Client implements methods from NodeJS.Events. Testing a few.
client = client.on(splitEvent, () => {});
const a: boolean = client.emit(splitEvent);
client = client.removeAllListeners(splitEvent);
client = client.removeAllListeners();
const b: number = client.listenerCount(splitEvent);
let nodeEventEmitter: NodeJS.EventEmitter = client;

// Ready and destroy
const readyPromise: Promise<void> = client.ready();
const destroyPromise: Promise<void> = client.destroy();

// We can call getTreatment with or without a key.
treatment = client.getTreatment(splitKey, 'mySplit');
treatment = client.getTreatment('mySplit');
// Attributes parameter is optional on both signatures.
treatment = client.getTreatment(splitKey, 'mySplit', attributes);
treatment = client.getTreatment('mySplit', attributes);

// We can call getTreatments with or without a key.
treatments = client.getTreatments(splitKey, ['mySplit']);
treatments = client.getTreatments(['mySplit']);
// Attributes parameter is optional on both signatures.
treatments = client.getTreatments(splitKey, ['mySplit'], attributes);
treatments = client.getTreatments(['mySplit'], attributes);

// We can call getTreatmentWithConfig with or without a key.
treatmentWithConfig = client.getTreatmentWithConfig(splitKey, 'mySplit');
treatmentWithConfig = client.getTreatmentWithConfig('mySplit');
// Attributes parameter is optional on both signatures.
treatmentWithConfig = client.getTreatmentWithConfig(splitKey, 'mySplit', attributes);
treatmentWithConfig = client.getTreatmentWithConfig('mySplit', attributes);

// We can call getTreatmentsWithConfig with or without a key.
treatmentsWithConfig = client.getTreatmentsWithConfig(splitKey, ['mySplit']);
treatmentsWithConfig = client.getTreatmentsWithConfig(['mySplit']);
// Attributes parameter is optional on both signatures.
treatmentsWithConfig = client.getTreatmentsWithConfig(splitKey, ['mySplit'], attributes);
treatmentsWithConfig = client.getTreatmentsWithConfig(['mySplit'], attributes);

// We can call track with or without a key. Traffic type can also be binded to the client.
tracked = client.track(splitKey, 'myTrafficType', 'myEventType'); // all params
tracked = client.track('myTrafficType', 'myEventType'); // key binded, tt provided.
tracked = client.track('myEventType'); // key and tt binded.
// Value parameter is optional on all signatures.
tracked = client.track(splitKey, 'myTrafficType', 'myEventType', 10);
tracked = client.track('myTrafficType', 'myEventType', 10);
tracked = client.track('myEventType', 10);
// Properties parameter is optional on all signatures.
tracked = client.track(splitKey, 'myTrafficType', 'myEventType', 10, { prop1: 1, prop2: '2', prop3: false, prop4: null });
tracked = client.track('myTrafficType', 'myEventType', null, { prop1: 1, prop2: '2', prop3: false, prop4: null });
tracked = client.track('myEventType', undefined, { prop1: 1, prop2: '2', prop3: false, prop4: null });

/*** Repeating tests for Async Client ***/

// Events constants we get (same as for sync client, just for interface checking)
const eventConstsAsymc: {[key: string]: SplitIO.Event} = client.Event;
splitEvent = client.Event.SDK_READY;
splitEvent = client.Event.SDK_READY_FROM_CACHE;
splitEvent = client.Event.SDK_READY_TIMED_OUT;
splitEvent = client.Event.SDK_UPDATE;

// Client implements methods from NodeJS.Events. (same as for sync client, just for interface checking)
client = client.on(splitEvent, () => {});
const a1: boolean = client.emit(splitEvent);
client = client.removeAllListeners(splitEvent);
client = client.removeAllListeners();
const b1: number = client.listenerCount(splitEvent);
nodeEventEmitter = client;

// Ready and destroy (same as for sync client, just for interface checking)
const readyPromise1: Promise<void> = client.ready();
client.destroy();

// We can call getTreatment but always with a key.
asyncTreatment = asyncClient.getTreatment(splitKey, 'mySplit');
// Attributes parameter is optional
asyncTreatment = asyncClient.getTreatment(splitKey, 'mySplit', attributes);

// We can call getTreatments but always with a key.
asyncTreatments = asyncClient.getTreatments(splitKey, ['mySplit']);
// Attributes parameter is optional
asyncTreatments = asyncClient.getTreatments(splitKey, ['mySplit'], attributes);

// We can call getTreatmentWithConfig but always with a key.
asyncTreatmentWithConfig = asyncClient.getTreatmentWithConfig(splitKey, 'mySplit');
// Attributes parameter is optional
asyncTreatmentWithConfig = asyncClient.getTreatmentWithConfig(splitKey, 'mySplit', attributes);

// We can call getTreatments but always with a key.
asyncTreatmentsWithConfig = asyncClient.getTreatmentsWithConfig(splitKey, ['mySplit']);
// Attributes parameter is optional
asyncTreatmentsWithConfig = asyncClient.getTreatmentsWithConfig(splitKey, ['mySplit'], attributes);

// We can call track only with a key.
trackPromise = asyncClient.track(splitKey, 'myTrafficType', 'myEventType'); // all required params
// Value parameter is optional.
trackPromise = asyncClient.track(splitKey, 'myTrafficType', 'myEventType', 10);
// Properties parameter is optional
trackPromise = asyncClient.track(splitKey, 'myTrafficType', 'myEventType', 10, { prop1: 1, prop2: '2', prop3: true, prop4: null });

/**** Tests for IManager interface ****/

splitNames = manager.names();
splitView = manager.split('mySplit');
splitViews = manager.splits();

// Manager implements ready promise.
const managerReadyPromise: Promise<void> = manager.ready();

// Manager implements methods from NodeJS.Events. Testing a few.
manager = manager.on(splitEvent, () => {});
const aa: boolean = manager.emit(splitEvent);
manager = manager.removeAllListeners(splitEvent);
manager = manager.removeAllListeners();
const bb: number = manager.listenerCount(splitEvent);
nodeEventEmitter = manager;

// manager exposes Event constants too
const managerEventConsts: {[key: string]: SplitIO.Event} = manager.Event;
splitEvent = manager.Event.SDK_READY;
splitEvent = manager.Event.SDK_READY_FROM_CACHE;
splitEvent = manager.Event.SDK_READY_TIMED_OUT;
splitEvent = manager.Event.SDK_UPDATE;

/*** Repeating tests for Async Manager ***/

splitNamesAsync = asyncManager.names();
splitViewAsync = asyncManager.split('mySplit');
splitViewsAsync = asyncManager.splits();

// asyncManager implements ready promise.
const asyncManagerReadyPromise: Promise<void> = asyncManager.ready();

// asyncManager implements methods from NodeJS.Events. Testing a few.
asyncManager = asyncManager.on(splitEvent, () => {});
const aaa: boolean = asyncManager.emit(splitEvent);
asyncManager = asyncManager.removeAllListeners(splitEvent);
asyncManager = asyncManager.removeAllListeners();
const bbb: number = asyncManager.listenerCount(splitEvent);
nodeEventEmitter = asyncManager;

// asyncManager exposes Event constants too
const asyncManagerEventConsts: {[key: string]: SplitIO.Event} = asyncManager.Event;
splitEvent = asyncManager.Event.SDK_READY;
splitEvent = asyncManager.Event.SDK_READY_FROM_CACHE;
splitEvent = asyncManager.Event.SDK_READY_TIMED_OUT;
splitEvent = asyncManager.Event.SDK_UPDATE;

/*** Tests for IImpressionListener interface ***/
class MyImprListener implements SplitIO.IImpressionListener {
  logImpression(data: SplitIO.ImpressionData) {
    impressionData = data;
  }
}

const MyImprListenerMap: SplitIO.IImpressionListener = {
  logImpression: (data: SplitIO.ImpressionData) => {
    impressionData = data;
  }
};

impressionListener = MyImprListenerMap;
impressionListener = new MyImprListener();
impressionListener.logImpression(impressionData);

/**** Tests for fully crowded settings interfaces ****/

// Split filters
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
  identities: [{ key: 'key1', trafficType: 'tt1'}, { key: 'key2', trafficType: 'tt2'}],
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
    authorizationKey: 'asd',
    key: 'asd',
    trafficType: 'myTT',
    labelsEnabled: false
  },
  scheduler: {
    featuresRefreshRate: 1,
    impressionsRefreshRate: 1,
    metricsRefreshRate: 1,
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
    streaming: 'https://asd.com/streaming'
  },
  features: mockedFeaturesMap,
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
    impressionsMode: 'DEBUG'
  }
};
fullBrowserSettings.storage.type = 'MEMORY';
fullBrowserSettings.integrations[0].type = 'GOOGLE_ANALYTICS_TO_SPLIT';

let fullNodeSettings: SplitIO.INodeSettings = {
  core: {
    authorizationKey: 'asd',
    labelsEnabled: false,
    IPAddressesEnabled: false
  },
  scheduler: {
    featuresRefreshRate: 1,
    impressionsRefreshRate: 1,
    metricsRefreshRate: 1,
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
    streaming: 'https://asd.com/streaming'
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
    impressionsMode: 'OPTIMIZED'
  }
};
fullNodeSettings.storage.type = 'MEMORY';
fullNodeSettings.mode = 'consumer';

let fullAsyncSettings: SplitIO.INodeAsyncSettings = {
  core: {
    authorizationKey: 'asd',
    labelsEnabled: false,
    IPAddressesEnabled: false
  },
  scheduler: {
    featuresRefreshRate: 1,
    impressionsRefreshRate: 1,
    metricsRefreshRate: 1,
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
      opt1: 'whatever'
    },
    prefix: 'PREFIX'
  },
  impressionListener: impressionListener,
  mode: 'standalone',
  debug: true,
  sync: {
    splitFilters: splitFilters
  }
};
