/**
 * Split software typescript declarations testing.
 * This file is not meant to run but to be compiled without errors. This is the same way to test .d.ts files
 * that you will need to comply to publish packages on @types organization on NPM (DefinitelyTyped).
 * We import the declarations through the NPM package name (using the development branch of the repo)
 * to test in the same way in which customers will be using it on development.
 * The step of compiling this file will be part of the continous integration systems in place.
 *
 * @author Nico Zelaya <nicolas.zelaya@split.io>
 */

import SplitFacade = require('@splitsoftware/splitio');

let stringPromise: Promise<string>;
let splitViewPromise: Promise<SplitIO.SplitView>;
let splitViewsPromise: Promise<SplitIO.SplitViews>;
let treatmentsPromise: Promise<SplitIO.Treatments>;

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

/**** Custom Types ****/

// Common
let treatment: SplitIO.Treatment = 'on';
let asyncTreatment: SplitIO.AsyncTreatment = stringPromise;
let treatmentsMap: SplitIO.Treatments = {
  feature1: 'on',
  feature2: 'control'
};
let treatments: SplitIO.Treatments = treatmentsMap;
let asyncTreatments: SplitIO.AsyncTreatments = treatmentsPromise;
let splitEvent: SplitIO.Event;
const attributes: SplitIO.Attributes = {
  attr1: 1,
  attr2: '2',
  attr3: Date.now(),
  attr4: ['str1', 2],
  attr5: ['str1', 'str2'],
  attr6: [1, 2],
  attr7: true,
  attr8: false
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
let splitViewAsync: SplitIO.SplitViewAsync;
let splitViewsAsync: SplitIO.SplitViewsAsync;
// Storages
let nodeStorage: SplitIO.NodeSyncStorage;
let nodeAsyncStorage: SplitIO.NodeAsyncStorage;
let browserStorage: SplitIO.BrowserStorage;

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
  changeNumber: 18294
};
splitViews = [splitView];

splitViewAsync = splitViewPromise;
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
SDK = SplitFacade(browserSettings);
SDK = SplitFacade(nodeSettings);
AsyncSDK = SplitFacade(asyncSettings);

// The settings values the SDK expose.
const instantiatedSettingsCore: {
  authorizationKey: string,
  key: SplitIO.SplitKey,
  labelsEnabled: boolean
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
manager = SDK.manager();

asyncClient = AsyncSDK.client();
asyncClient = AsyncSDK.client('a customer key');
asyncManager = AsyncSDK.manager();

// Logger
SDK.Logger.enable();
SDK.Logger.disable();

AsyncSDK.Logger.enable();
AsyncSDK.Logger.disable();

/**** Tests for IClient interface ****/

// Events constants we get
const eventConsts: {[key: string]: SplitIO.Event} = client.Event;
splitEvent = client.Event.SDK_READY;
splitEvent = client.Event.SDK_READY_TIMED_OUT;
splitEvent = client.Event.SDK_UPDATE;

// Client implements methods from NodeJS.Events. Testing a few.
client = client.on(splitEvent, () => {});
const a: boolean = client.emit(splitEvent);
client = client.removeAllListeners(splitEvent);
client = client.removeAllListeners();
const b: number = client.listenerCount(splitEvent);

// Ready and destroy
const readyPromise: Promise<void> = client.ready();
client.destroy();

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

/*** Repeating tests for Async Client...  */

// Events constants we get (same as for sync client, just for interface checking)
const eventConstsAsymc: {[key: string]: SplitIO.Event} = client.Event;
splitEvent = client.Event.SDK_READY;
splitEvent = client.Event.SDK_READY_TIMED_OUT;
splitEvent = client.Event.SDK_UPDATE;

// Client implements methods from NodeJS.Events. (same as for sync client, just for interface checking)
client = client.on(splitEvent, () => {});
const a1: boolean = client.emit(splitEvent);
client = client.removeAllListeners(splitEvent);
client = client.removeAllListeners();
const b1: number = client.listenerCount(splitEvent);

// Ready and destroy (same as for sync client, just for interface checking)
const readyPromise1: Promise<void> = client.ready();
client.destroy();

// We can call getTreatment with or without a key.
asyncTreatment = asyncClient.getTreatment(splitKey, 'mySplit');
asyncTreatment = asyncClient.getTreatment('mySplit');
// Attributes parameter is optional on both signatures.
asyncTreatment = asyncClient.getTreatment(splitKey, 'mySplit', attributes);
asyncTreatment = asyncClient.getTreatment('mySplit', attributes);

// We can call getTreatments with or without a key.
asyncTreatments = asyncClient.getTreatments(splitKey, ['mySplit']);
asyncTreatments = asyncClient.getTreatments(['mySplit']);
// Attributes parameter is optional on both signatures.
asyncTreatments = asyncClient.getTreatments(splitKey, ['mySplit'], attributes);
asyncTreatments = asyncClient.getTreatments(['mySplit'], attributes);

/**** Tests for IManager interface ****/

splitNames = manager.names();
splitView = manager.split('mySplit');
splitViews = manager.splits();

/*** Repeating tests for Async Manager...  */

splitNames = asyncManager.names(); // Split names are the same.
splitViewAsync = asyncManager.split('mySplit');
splitViewsAsync = asyncManager.splits();

/**** Tests for fully crowded settings interfaces ****/

let fullBrowserSettings: SplitIO.IBrowserSettings = {
  core: {
    authorizationKey: 'asd',
    key: 'asd',
    labelsEnabled: false
  },
  scheduler: {
    featuresRefreshRate: 1,
    impressionsRefreshRate: 1,
    metricsRefreshRate: 1,
    segmentsRefreshRate: 1,
    offlineRefreshRate: 1
  },
  startup: {
    readyTimeout: 1,
    requestTimeoutBeforeReady: 1,
    retriesOnFailureBeforeReady: 1
  },
  features: mockedFeaturesMap,
  storage: {
    type: 'LOCALSTORAGE',
    prefix: 'PREFIX'
  },
  debug: true
};
fullBrowserSettings.storage.type = 'MEMORY';

let fullNodeSettings: SplitIO.INodeSettings = {
  core: {
    authorizationKey: 'asd',
    labelsEnabled: false
  },
  scheduler: {
    featuresRefreshRate: 1,
    impressionsRefreshRate: 1,
    metricsRefreshRate: 1,
    segmentsRefreshRate: 1,
    offlineRefreshRate: 1
  },
  features: mockedFeaturesPath,
  storage: {
    type: 'LOCALSTORAGE',
    prefix: 'PREFIX'
  },
  mode: 'standalone',
  debug: false
};
fullNodeSettings.storage.type = 'MEMORY';
fullNodeSettings.mode = 'consumer';

let fullAsyncSettings: SplitIO.INodeAsyncSettings = {
  core: {
    authorizationKey: 'asd',
    labelsEnabled: false
  },
  scheduler: {
    featuresRefreshRate: 1,
    impressionsRefreshRate: 1,
    metricsRefreshRate: 1,
    segmentsRefreshRate: 1,
    offlineRefreshRate: 1
  },
  features: mockedFeaturesPath,
  storage: {
    type: 'REDIS',
    options: {
      opt1: 'whatever'
    },
    prefix: 'PREFIX'
  },
  mode: 'standalone',
  debug: true
};
