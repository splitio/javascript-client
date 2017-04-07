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

/**** Interfaces ****/

// Facade return interface
let SDK: SplitIO.ISDK;
// Settings interfaces
let nodeSettings: SplitIO.INodeSettings;
let browserSettings: SplitIO.IBrowserSettings;
// Client & Manager APIs
let client: SplitIO.IClient;
let manager: SplitIO.IManager;

/**** Custom Types ****/

// Common
let treatment: SplitIO.Treatment = 'on';
let treatmentsMap: SplitIO.Treatments = {
  feature1: 'on',
  feature2: 'control'
};
let treatments: SplitIO.Treatments = treatmentsMap;
let splitEvent: SplitIO.Event;
const attributes: SplitIO.Attributes = {
  attr1: 1,
  attr2: '2',
  attr3: Date.now()
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
let splitViewData: SplitIO.SplitViewData;
let splitView: SplitIO.SplitView;
let splitViews: SplitIO.SplitViews;
let splitNames: SplitIO.SplitNames;
// Storages
let nodeStorage: SplitIO.NodeStorage;
let browserStorage: SplitIO.BrowserStorage;

// Treatment can be the string or the promise which will resolve to treatment string
let stringPromise: Promise<string>;
treatment = 'some treatment';
treatment = stringPromise;
// Treatments can be the object or the promise which will resolve to treatments object
let treatmentsPromise: Promise<SplitIO.Treatments>;
treatments = {
  someFeature: 'treatment'
};
treatments = treatmentsPromise;
// SplitViews can be the SplitViewData or the promise which will resolve to SplitViewData obj
let splitViewPromise: Promise<SplitIO.SplitViewData>;
splitView = splitViewData;
splitView = splitViewPromise;
// Split key could be a split key object or a string
splitKey = 'someKey';
splitKey = splitKeyObj;

/**** Tests for ISDK interface ****/

nodeSettings = {
  core: {
    authorizationKey: 'key'
  }
};
browserSettings = {
  core: {
    authorizationKey: 'another-key',
    key: 'customer-key'
  }
}
// Both signatures should return ISDK
SDK = SplitFacade(browserSettings);
SDK = SplitFacade(nodeSettings);

// The settings values the SDK expose.
const instantiatedSettingsCore: {
  authorizationKey: string,
  key: SplitIO.SplitKey,
  labelsEnabled: boolean
} = SDK.settings.core;
const instantiatedSettingsMode: ('standalone' | 'consumer') = SDK.settings.mode;
const instantiatedSettingsScheduler: {[key: string]: number} = SDK.settings.scheduler;
const instantiatedSettingsStartup: {[key: string]: number} = SDK.settings.startup;
const instantiatedSettingsStorage: { // I check the specific object here because it has specific types
  prefix: string,
  options: Object,
  type: SplitIO.NodeStorage | SplitIO.BrowserStorage
} = SDK.settings.storage;
const instantiatedSettingsUrls: {[key: string]: string} = SDK.settings.urls;
const instantiatedSettingsVersion: string = SDK.settings.version;
let instantiatedSettingsFeatures: {[key: string]: string} = SDK.settings.features;
// We should be able to write on features prop. The rest are readonly.
instantiatedSettingsFeatures.something = 'something';

// Client and Manager
client = SDK.client();
client = SDK.client('a customer key');
manager = SDK.manager();

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

/**** Tests for IManager interface ****/

splitNames = manager.names();
splitView = manager.split('mySplit');
splitViews = manager.splits();

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
  }
};
fullBrowserSettings.storage.type = 'MEMORY'

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
    type: 'REDIS',
    options: {
      opt1: 'whatever'
    },
    prefix: 'PREFIX'
  },
  mode: 'standalone'
};
fullNodeSettings.storage.type = 'LOCALSTORAGE';
fullNodeSettings.storage.type = 'MEMORY';
fullNodeSettings.mode = 'consumer';
