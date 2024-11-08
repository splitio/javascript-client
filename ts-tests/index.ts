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

import { SplitFactory } from '../types/index';
import { SplitFactory as SplitFactoryCS } from '../types/client';
import { SplitFactory as SplitFactorySS } from '../types/server';

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
let BrowserSDK: SplitIO.IBrowserSDK;
// Settings interfaces
let nodeSettings: SplitIO.INodeSettings;
let asyncSettings: SplitIO.INodeAsyncSettings;
let browserSettings: SplitIO.IBrowserSettings;
// Client & Manager APIs
let client: SplitIO.IClient;
let manager: SplitIO.IManager;
let asyncClient: SplitIO.IAsyncClient;
let asyncManager: SplitIO.IAsyncManager;
let browserClient: SplitIO.IBrowserClient;
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
  },
  sets: ['set_a', 'set_b'],
  defaultTreatment: 'off'
};
splitViews = [splitView];

splitViewAsync = splitViewPromise;
splitNamesAsync = splitNamesPromise;
splitViewsAsync = splitViewsPromise;

// Split key could be a split key object or a string
splitKey = 'someKey';
splitKey = splitKeyObj;

/**** Tests for ISDK interface ****/

// For Node.js with sync storage
nodeSettings = {
  core: {
    authorizationKey: 'key'
  }
};
// For Node.js with async storage
asyncSettings = {
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
AsyncSDK = SplitFactory(asyncSettings);
BrowserSDK = SplitFactory(browserSettings);
SDK = SplitFactorySS(nodeSettings);
AsyncSDK = SplitFactorySS(asyncSettings);
BrowserSDK = SplitFactoryCS(browserSettings);

// The settings values the SDK expose.
const instantiatedSettingsCore: {
  authorizationKey: string,
  key: SplitIO.SplitKey,
  labelsEnabled: boolean,
  IPAddressesEnabled: boolean
} = SDK.settings.core;
const instantiatedSettingsMode: ('standalone' | 'consumer' | 'consumer_partial' | 'localhost') = SDK.settings.mode;
const instantiatedSettingsScheduler: { [key: string]: number } = SDK.settings.scheduler;
const instantiatedSettingsStartup: { [key: string]: number } = SDK.settings.startup;
const instantiatedSettingsStorage = SDK.settings.storage as SplitIO.StorageOptions;
const instantiatedSettingsUrls: { [key: string]: string } = SDK.settings.urls;
const instantiatedSettingsVersion: string = SDK.settings.version;
let instantiatedSettingsFeatures = SDK.settings.features as SplitIO.MockedFeaturesMap;
// We should be able to write on features prop. The rest are readonly props.
instantiatedSettingsFeatures.something = 'something';
SDK.settings.features = 'new_file_path'; // Node.js
SDK.settings.features = { 'split_x': 'on' }; // Browser

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
const eventConsts: { [key: string]: SplitIO.Event } = client.Event;
splitEvent = client.Event.SDK_READY;
splitEvent = client.Event.SDK_READY_FROM_CACHE;
splitEvent = client.Event.SDK_READY_TIMED_OUT;
splitEvent = client.Event.SDK_UPDATE;

// Client implements methods from Node.js EventEmitter. Testing a few.
client = client.on(splitEvent, () => { });
const a: boolean = client.emit(splitEvent);
client = client.removeAllListeners(splitEvent);
client = client.removeAllListeners();
const b: number = client.listenerCount(splitEvent);
let nodeEventEmitter: NodeJS.EventEmitter = client;

// Ready, destroy and flush
let promise: Promise<void> = client.ready();
promise = client.destroy();
promise = SDK.destroy();
// @TODO not public yet
// promise = client.flush();

// We can call getTreatment with or without a key.
treatment = client.getTreatment(splitKey, 'mySplit');
treatment = browserClient.getTreatment('mySplit');
// Attributes parameter is optional on both signatures.
treatment = client.getTreatment(splitKey, 'mySplit', attributes);
treatment = browserClient.getTreatment('mySplit', attributes);

// We can call getTreatments with or without a key.
treatments = client.getTreatments(splitKey, ['mySplit']);
treatments = browserClient.getTreatments(['mySplit']);
// Attributes parameter is optional on both signatures.
treatments = client.getTreatments(splitKey, ['mySplit'], attributes);
treatments = browserClient.getTreatments(['mySplit'], attributes);

// We can call getTreatmentWithConfig with or without a key.
treatmentWithConfig = client.getTreatmentWithConfig(splitKey, 'mySplit');
treatmentWithConfig = browserClient.getTreatmentWithConfig('mySplit');
// Attributes parameter is optional on both signatures.
treatmentWithConfig = client.getTreatmentWithConfig(splitKey, 'mySplit', attributes);
treatmentWithConfig = browserClient.getTreatmentWithConfig('mySplit', attributes);

// We can call getTreatmentsWithConfig with or without a key.
treatmentsWithConfig = client.getTreatmentsWithConfig(splitKey, ['mySplit']);
treatmentsWithConfig = browserClient.getTreatmentsWithConfig(['mySplit']);
// Attributes parameter is optional on both signatures.
treatmentsWithConfig = client.getTreatmentsWithConfig(splitKey, ['mySplit'], attributes);
treatmentsWithConfig = browserClient.getTreatmentsWithConfig(['mySplit'], attributes);

// We can call getTreatmentsByFlagSet with or without a key.
treatments = client.getTreatmentsByFlagSet(splitKey, 'set_a');
treatments = browserClient.getTreatmentsByFlagSet('set_a');
// Attributes parameter is optional.
treatments = client.getTreatmentsByFlagSet(splitKey, 'set_a', attributes);
treatments = browserClient.getTreatmentsByFlagSet('set_a', attributes);

// We can call getTreatmentsByFlagSets with or without a key.
treatments = client.getTreatmentsByFlagSets(splitKey, ['set_a']);
treatments = browserClient.getTreatmentsByFlagSets(['set_a']);
// Attributes parameter is optional.
treatments = client.getTreatmentsByFlagSets(splitKey, ['set_a'], attributes);
treatments = browserClient.getTreatmentsByFlagSets(['set_a'], attributes);

// We can call getTreatmentsWithConfigByFlagSet with or without a key.
treatmentsWithConfig = client.getTreatmentsWithConfigByFlagSet(splitKey, 'set_a');
treatmentsWithConfig = browserClient.getTreatmentsWithConfigByFlagSet('set_a');
// Attributes parameter is optional.
treatmentsWithConfig = client.getTreatmentsWithConfigByFlagSet(splitKey, 'set_a', attributes);
treatmentsWithConfig = browserClient.getTreatmentsWithConfigByFlagSet('set_a', attributes);

// We can call getTreatmentsWithConfigByFlagSets with or without a key.
treatmentsWithConfig = client.getTreatmentsWithConfigByFlagSets(splitKey, ['set_a']);
treatmentsWithConfig = browserClient.getTreatmentsWithConfigByFlagSets(['set_a']);
// Attributes parameter is optional.
treatmentsWithConfig = client.getTreatmentsWithConfigByFlagSets(splitKey, ['set_a'], attributes);
treatmentsWithConfig = browserClient.getTreatmentsWithConfigByFlagSets(['set_a'], attributes);

// We can call track with or without a key.
tracked = client.track(splitKey, 'myTrafficType', 'myEventType'); // all params
tracked = browserClient.track('myTrafficType', 'myEventType'); // key bound, tt provided.
// Value parameter is optional on all signatures.
tracked = client.track(splitKey, 'myTrafficType', 'myEventType', 10);
tracked = browserClient.track('myTrafficType', 'myEventType', 10);
// Properties parameter is optional on all signatures.
tracked = client.track(splitKey, 'myTrafficType', 'myEventType', 10, { prop1: 1, prop2: '2', prop3: false, prop4: null });
tracked = browserClient.track('myTrafficType', 'myEventType', undefined, { prop1: 1, prop2: '2', prop3: false, prop4: null });

/*** Repeating tests for Async Client ***/

// Events constants we get (same as for sync client, just for interface checking)
const eventConstsAsync: { [key: string]: SplitIO.Event } = asyncClient.Event;
splitEvent = asyncClient.Event.SDK_READY;
splitEvent = asyncClient.Event.SDK_READY_FROM_CACHE;
splitEvent = asyncClient.Event.SDK_READY_TIMED_OUT;
splitEvent = asyncClient.Event.SDK_UPDATE;

// Client implements methods from Node.js EventEmitter. (same as for sync client, just for interface checking)
asyncClient = asyncClient.on(splitEvent, () => { });
const a1: boolean = asyncClient.emit(splitEvent);
asyncClient = asyncClient.removeAllListeners(splitEvent);
asyncClient = asyncClient.removeAllListeners();
const b1: number = asyncClient.listenerCount(splitEvent);
nodeEventEmitter = asyncClient;

// Ready, destroy and flush (same as for sync client, just for interface checking)
promise = asyncClient.ready();
promise = asyncClient.destroy();
promise = AsyncSDK.destroy();
// @TODO not public yet
// promise = asyncClient.flush();

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

// We can call getTreatmentsByFlagSet
asyncTreatments = asyncClient.getTreatmentsByFlagSet(splitKey, 'set_a');
// Attributes parameter is optional
asyncTreatments = asyncClient.getTreatmentsByFlagSet(splitKey, 'set_a', attributes);

// We can call getTreatmentsByFlagSets
asyncTreatments = asyncClient.getTreatmentsByFlagSets(splitKey, ['set_a']);
// Attributes parameter is optional
asyncTreatments = asyncClient.getTreatmentsByFlagSets(splitKey, ['set_a'], attributes);

// We can call getTreatmentsWithConfigByFlagSet
asyncTreatmentsWithConfig = asyncClient.getTreatmentsWithConfigByFlagSet(splitKey, 'set_a');
// Attributes parameter is optional
asyncTreatmentsWithConfig = asyncClient.getTreatmentsWithConfigByFlagSet(splitKey, 'set_a', attributes);

// We can call getTreatmentsByFlagSets but always with a key.
asyncTreatmentsWithConfig = asyncClient.getTreatmentsWithConfigByFlagSets(splitKey, ['set_a']);
// Attributes parameter is optional
asyncTreatmentsWithConfig = asyncClient.getTreatmentsWithConfigByFlagSets(splitKey, ['set_a'], attributes);

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
promise = manager.ready();

// Manager implements methods from Node.js EventEmitter. Testing a few.
manager = manager.on(splitEvent, () => { });
const aa: boolean = manager.emit(splitEvent);
manager = manager.removeAllListeners(splitEvent);
manager = manager.removeAllListeners();
const bb: number = manager.listenerCount(splitEvent);
nodeEventEmitter = manager;

// manager exposes Event constants too
const managerEventConsts: { [key: string]: SplitIO.Event } = manager.Event;
splitEvent = manager.Event.SDK_READY;
splitEvent = manager.Event.SDK_READY_FROM_CACHE;
splitEvent = manager.Event.SDK_READY_TIMED_OUT;
splitEvent = manager.Event.SDK_UPDATE;

/*** Repeating tests for Async Manager ***/

splitNamesAsync = asyncManager.names();
splitViewAsync = asyncManager.split('mySplit');
splitViewsAsync = asyncManager.splits();

// asyncManager implements ready promise.
promise = asyncManager.ready();

// asyncManager implements methods from Node.js EventEmitter. Testing a few.
asyncManager = asyncManager.on(splitEvent, () => { });
const aaa: boolean = asyncManager.emit(splitEvent);
asyncManager = asyncManager.removeAllListeners(splitEvent);
asyncManager = asyncManager.removeAllListeners();
const bbb: number = asyncManager.listenerCount(splitEvent);
nodeEventEmitter = asyncManager;

// asyncManager exposes Event constants too
const asyncManagerEventConsts: { [key: string]: SplitIO.Event } = asyncManager.Event;
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

/**** Tests for attribute binding ****/
let stored: boolean = browserClient.setAttribute('stringAttribute', 'value');
stored = browserClient.setAttribute('numberAttribtue', 1);
stored = browserClient.setAttribute('booleanAttribute', true);
stored = browserClient.setAttribute('stringArrayAttribute', ['value1', 'value2']);
stored = browserClient.setAttribute('numberArrayAttribute', [1, 2]);

let storedAttributeValue: SplitIO.AttributeType = browserClient.getAttribute('stringAttribute');
storedAttributeValue = browserClient.getAttribute('numberAttribute');
storedAttributeValue = browserClient.getAttribute('booleanAttribute');
storedAttributeValue = browserClient.getAttribute('stringArrayAttribute');
storedAttributeValue = browserClient.getAttribute('numberArrayAttribute');

let removed: boolean = browserClient.removeAttribute('numberAttribute');
removed = browserClient.clearAttributes();

let attr: SplitIO.Attributes = {
  stringAttribute: 'value',
  numberAttribute: 1,
  booleanAttribute: true,
  stringArrayAttribute: ['value1', 'value2'],
  numberArrayAttribute: [1, 2]
}

stored = browserClient.setAttributes(attr);
let storedAttr: SplitIO.Attributes = browserClient.getAttributes();
removed = browserClient.clearAttributes();

/**** Tests for user consent API ****/

let userConsent: SplitIO.ConsentStatus;
userConsent = BrowserSDK.UserConsent.getStatus();
BrowserSDK.UserConsent.setStatus(true);
BrowserSDK.UserConsent.setStatus(false);
userConsent = BrowserSDK.UserConsent.Status.DECLINED;
userConsent = BrowserSDK.UserConsent.Status.GRANTED;
userConsent = BrowserSDK.UserConsent.Status.UNKNOWN;

/**** Tests for fully crowded settings interfaces ****/

// Split filters
let splitFilters: SplitIO.SplitFilter[] = [{ type: 'bySet', values: ['set_a', 'set_b'] }, { type: 'byName', values: ['my_split_1', 'my_split_1'] }, { type: 'byPrefix', values: ['my_split', 'test_split_'] }]

let fullBrowserSettings: SplitIO.IBrowserSettings = {
  core: {
    authorizationKey: 'asd',
    key: 'asd',
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
    authorizationKey: 'asd',
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
    authorizationKey: 'asd',
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
