// Type definitions for Javascript and Node Split Software SDK v8.1.0
// Project: http://www.split.io/
// Definitions by: Nico Zelaya <https://github.com/NicoZelaya/>

/// <reference types="node" />

export as namespace SplitIO;
export = SplitIO;

/**
 * @typedef {Object} EventConsts
 * @property {string} SDK_READY The ready event.
 * @property {string} SDK_READY_TIMED_OUT The timeout event.
 * @property {string} SDK_UPDATE The update event.
 */
type EventConsts = {
  SDK_READY: 'init::ready',
  SDK_READY_TIMED_OUT: 'init::timeout',
  SDK_UPDATE: 'state::update'
};
/**
 * SDK Modes.
 * @typedef {string} SDKMode
 */
type SDKMode = 'standalone' | 'consumer';
/**
 * Storage types.
 * @typedef {string} StorageType
 */
type StorageType = 'MEMORY' | 'LOCALSTORAGE' | 'REDIS';
/**
 * Settings interface. This is a representation of the settings the SDK expose, that's why
 * most of it's props are readonly. Only features should be rewritten when localhost mode is active.
 * @interface ISettings
 */
interface ISettings {
  readonly core: {
    authorizationKey: string,
    key: SplitIO.SplitKey,
    trafficType: string,
    labelsEnabled: boolean
  },
  readonly mode: SDKMode,
  readonly scheduler: {
    featuresRefreshRate: number,
    impressionsRefreshRate: number,
    metricsRefreshRate: number,
    segmentsRefreshRate: number,
    offlineRefreshRate: number,
    eventsPushRate: number,
    eventsQueueSize: number
  },
  readonly startup: {
    readyTimeout: number,
    requestTimeoutBeforeReady: number,
    retriesOnFailureBeforeReady: number,
    eventsFirstPushWindow: number
  },
  readonly storage: {
    prefix: string,
    options: Object,
    type: StorageType
  },
  readonly urls: {
    events: string,
    sdk: string
  },
  readonly debug: boolean,
  readonly version: string,
  features: {
    [featureName: string]: string
  }
}
/**
 * Logger API
 * @interface ILoggerAPI
 */
interface ILoggerAPI {
  /**
   * Enables SDK logging to the console.
   * @function enable
   * @returns {void}
   */
  enable(): void,
  /**
   * Disables SDK logging.
   * @function disable
   * @returns {void}
   */
  disable(): void
}
/**
 * Common settings between Browser and NodeJS settings interface.
 * @interface ISharedSettings
 */
interface ISharedSettings {
  /**
   * SDK scheduler settings.
   * @property {Object} scheduler
   */
  scheduler?: {
    /**
     * The SDK polls Split servers for changes to feature roll-out plans. This parameter controls this polling period in seconds.
     * @property {number} featuresRefreshRate
     * @default 30
     */
    featuresRefreshRate?: number,
    /**
     * The SDK sends information on who got what treatment at what time back to Split servers to power analytics. This parameter controls how often this data is sent to Split servers. The parameter should be in seconds.
     * @property {number} impressionsRefreshRate
     * @default 60
     */
    impressionsRefreshRate?: number,
    /**
     * The SDK sends diagnostic metrics to Split servers. This parameters controls this metric flush period in seconds.
     * @property {number} metricsRefreshRate
     * @default 60
     */
    metricsRefreshRate?: number,
    /**
     * The SDK polls Split servers for changes to segment definitions. This parameter controls this polling period in seconds.
     * @property {number} segmentsRefreshRate
     * @default 60
     */
    segmentsRefreshRate?: number,
    /**
     * The SDK posts the queued events data in bulks. This parameter controls the posting rate in seconds.
     * @property {number} eventsPushRate
     * @default 60
     */
    eventsPushRate?: number,
    /**
     * The maximum number of event items we want to queue. If we queue more values, it will trigger a flush and reset the timer.
     * If you use a 0 here, the queue will have no maximum size.
     * @property {number} eventsQueueSize
     * @default 500
     */
    eventsQueueSize?: number,
    /**
     * For mocking/testing only. The SDK will refresh the features mocked data when mode is set to "localhost" by defining the key.
     * For more information @see {@link http://docs.split.io/docs/nodejs-sdk-overview#section-running-the-sdk-in-off-the-grid-mode}
     * @property {number} offlineRefreshRate
     * @default 15
     */
    offlineRefreshRate?: number
  },
  /**
   * Wether the logger should be enabled or disabled by default.
   * @property {Boolean} debug
   * @default false
   */
  debug?: boolean
}
/**
 * Common settings interface for SDK instances on NodeJS.
 * @interface INodeBasicSettings
 * @extends ISharedSettings
 */
interface INodeBasicSettings extends ISharedSettings {
  /**
   * SDK Startup settings for NodeJS.
   * @property {Object} startup
   */
  startup?: {
    /**
     * Maximum amount of time used before notify a timeout.
     * @property {number} readyTimeout
     * @default 0
     */
    readyTimeout?: number,
    /**
     * Time to wait for a request before the SDK is ready. If this time expires, JS Sdk will retry 'retriesOnFailureBeforeReady' times before notifying its failure to be 'ready'.
     * @property {number} requestTimeoutBeforeReady
     * @default 15
     */
    requestTimeoutBeforeReady?: number,
    /**
     * How many quick retries we will do while starting up the SDK.
     * @property {number} retriesOnFailureBeforeReady
     * @default 0
     */
    retriesOnFailureBeforeReady?: number
  },
  /**
   * SDK Core settings for NodeJS.
   * @property {Object} core
   */
  core: {
    /**
     * Your API key. More information: @see {@link http://docs.split.io/docs/understanding-api-keys}
     * @property {string} authorizationKey
     */
    authorizationKey: string,
    /**
     * Disable labels from being sent to Split backend. Labels may contain sensitive information.
     * @property {boolean} labelsEnabled
     * @default true
     */
    labelsEnabled?: boolean
  },
  /**
   * Defines which kind of storage we should instanciate.
   * @property {Object} storage
   */
  storage?: {
    /**
     * Storage type to be instantiated by the SDK.
     * @property {StorageType} type
     * @default MEMORY
     */
    type?: StorageType,
    /**
     * Options to be passed to the selected storage. Use it with type: 'REDIS'
     * @property {Object} options
     */
    options?: Object,
    /**
     * Optional prefix to prevent any kind of data collision between SDK versions.
     * @property {string} prefix
     * @default SPLITIO
     */
    prefix?: string
  }
  /**
   * The SDK mode. Possible values are "standalone" (which is the default) and "consumer". For "localhost" mode, use "localhost" as authorizationKey.
   * @property {SDKMode} mode
   * @default standalone
   */
  mode?: SDKMode,
  /**
   * Mocked features file path. For testing purposses only. For using this you should specify "localhost" as authorizationKey on core settings.
   * @see {@link http://docs.split.io/docs/nodejs-sdk-overview#section-running-the-sdk-in-off-the-grid-mode}
   * @property {MockedFeaturesFilePath} features
   * @default $HOME/.split
   */
  features?: SplitIO.MockedFeaturesFilePath
}
/**
 * Common definitions between clients for different environments interface.
 * @interface IBasicClient
 * @extends NodeJS.Events
 */
interface IBasicClient extends NodeJS.Events {
  /**
   * Constant object containing the SDK events for you to use.
   * @property {EventConsts} Event
   */
  Event: EventConsts,
  /**
   * Tracks an event to be fed to the results product on Split Webconsole.
   * For usage on NodeJS as we don't have only one key.
   * @function track
   * @param {SplitKey} key - The key that identifies the entity related to this event.
   * @param {string} trafficType - The traffic type of the entity related to this event.
   * @param {string} eventType - The event type corresponding to this event.
   * @param {number=} value - The value of this event.
   * @returns {boolean} Wether the event was added to the queue succesfully or not.
   */
  track(key: SplitIO.SplitKey, trafficType: string, eventType: string, value?: number): boolean,
  /**
   * Tracks an event to be fed to the results product on Split Webconsole.
   * For usage on the Browser as we defined the key on the settings.
   * @function track
   * @param {string} trafficType - The traffic type of the entity related to this event.
   * @param {string} eventType - The event type corresponding to this event.
   * @param {number=} value - The value of this event.
   * @returns {boolean} Wether the event was added to the queue succesfully or not.
   */
  track(trafficType: string, eventType: string, value?: number): boolean,
  /**
   * Tracks an event to be fed to the results product on Split Webconsole.
   * For usage on the Browser if we defined the key and also the trafficType on the settings.
   * @function track
   * @param {string} eventType - The event type corresponding to this event.
   * @param {number=} value - The value of this event.
   * @returns {boolean} Wether the event was added to the queue succesfully or not.
   */
  track(eventType: string, value?: number): boolean,
  /**
   * Returns a promise that will be resolved once the SDK has finished loading.
   * @function ready
   * @deprecated Use on(sdk.Event.SDK_READY, callback: () => void) instead.
   * @returns {Promise<void>}
   */
  ready(): Promise<void>,
  /**
   * Destroy the client instance.
   * @function destroy
   * @returns {Promise<void>}
   */
  destroy(): Promise<void>
}
/**
 * Common definitions between managers for different environments interface.
 * @interface IBasicManager
 */
interface IBasicManager {
  /**
   * Returns the available split names in an array.
   * @function names
   * @returns {SplitNames} The array of split names or the promise that will be resolved with the array.
   */
  names(): SplitIO.SplitNames;
}
/**
 * Common definitions between SDK instances for different environments interface.
 * @interface IBasicSDK
 */
interface IBasicSDK {
  /**
   * Current settings of the SDK instance.
   * @property settings
   */
  settings: ISettings,
  /**
   * Logger API.
   * @property Logger
   */
  Logger: ILoggerAPI
}
/****** Exposed namespace ******/
/**
 * Types and interfaces for @splitsoftware/splitio package for usage when integrating javascript sdk on typescript apps.
 * For the SDK package information
 * @see {@link https://www.npmjs.com/package/@splitsoftware/splitio}
 */
declare namespace SplitIO {
  /**
   * Split treatment value, returned by getTreatment.
   * @typedef {string} Treatment
   */
  type Treatment = string;
  /**
   * Split treatment promise that will resolve to actual treatment value.
   * @typedef {Promise<string>} Treatment
   */
  type AsyncTreatment = Promise<string>;
  /**
   * An object with the treatments for a bulk of splits, returned by getTreatments. For example:
   *   {
   *     feature1: 'on',
   *     feature2: 'off
   *   }
   * @typedef {Object.<string>} Treatments
   */
  type Treatments = {
    [featureName: string]: string
  };
  /**
   * Split treatments promise that will resolve to the actual SplitIO.Treatments object.
   * @typedef {Promise<Treatments>} Treatments
   */
  type AsyncTreatments = Promise<Treatments>;
  /**
   * Possible split events.
   * @typedef {string} Event
   */
  type Event = 'init::timeout' | 'init::ready' | 'state::update';
  /**
   * Split attributes should be on object with values of type string or number (dates should be sent as millis since epoch).
   * @typedef {Object.<number, string>} Attributes
   * @see {@link http://docs.split.io/docs/javascript-sdk-overview#section-using-attributes-in-sdk}
   */
  type Attributes = {
    [attributeName: string]: string | number | Array<string | number>
  };
  /**
   * The SplitKey object format.
   * @typedef {Object.<string>} SplitKeyObject
   */
  type SplitKeyObject = {
    matchingKey: string,
    bucketingKey: string
  };
  /**
   * The customer identifier. Could be a SplitKeyObject or a string.
   * @typedef {SplitKeyObject|string} SplitKey
   */
  type SplitKey = SplitKeyObject | string;
  /**
   * Path to file with mocked features (for node).
   * @typedef {string} MockedFeaturesFilePath
   */
  type MockedFeaturesFilePath = string;
  /**
   * Object with mocked features mapping (for browser). We need to specify the featureName as key, and the mocked treatment as value.
   * @typedef {Object} MockedFeaturesMap
   */
  type MockedFeaturesMap = {
    [featureName: string]: string
  };
  /**
   * Data corresponding to one Split view.
   * @typedef {Object} SplitView
   */
  type SplitView = {
    /**
     * The name of the split.
     * @property {string} name
     */
    name: string,
    /**
     * The traffic type of the split.
     * @property {string} trafficType
     */
    trafficType: string,
    /**
     * Whether the split is killed or not.
     * @property {boolean} killed
     */
    killed: boolean,
    /**
     * The list of treatments available for the split.
     * @property {Array<string>} treatments
     */
    treatments: Array<string>,
    /**
     * Current change number of the split.
     * @property {number} changeNumber
     */
    changeNumber: number
  };
  /**
   * A promise that will be resolved with that SplitView.
   * @typedef {Promise<SplitView>} SplitView
   */
  type SplitViewAsync = Promise<SplitView>;
  /**
   * An array containing the SplitIO.SplitView elements.
   */
  type SplitViews = Array<SplitView>;
  /**
   * A promise that will be resolved with an SplitIO.SplitViews array.
   * @typedef {Promise<SplitViews>} SplitViewsAsync
   */
  type SplitViewsAsync = Promise<SplitViews>;
  /**
   * An array of split names.
   * @typedef {Array<string>} SplitNames
   */
  type SplitNames = Array<string>;
  /**
   * Synchronous storage valid types for NodeJS.
   * @typedef {string} NodeSyncStorage
   */
  type NodeSyncStorage = 'MEMORY' | 'LOCALSTORAGE';
  /**
   * Asynchronous storages valid types for NodeJS.
   * @typedef {string} NodeAsyncStorage
   */
  type NodeAsyncStorage = 'REDIS';
  /**
   * Storage valid types for the browser.
   * @typedef {string} BrowserStorage
   */
  type BrowserStorage = 'MEMORY' | 'LOCALSTORAGE';
  /**
   * Settings interface for SDK instances created on the browser
   * @interface IBrowserSettings
   * @extends ISharedSettings
   * @see {@link http://docs.split.io/docs/javascript-sdk-overview#section-advanced-configuration-of-the-sdk}
   */
  interface IBrowserSettings extends ISharedSettings {
    /**
     * SDK Startup settings for the Browser.
     * @property {Object} startup
     */
    startup?: {
      /**
       * Maximum amount of time used before notify a timeout.
       * @property {number} readyTimeout
       * @default 1.5
       */
      readyTimeout?: number,
      /**
       * Time to wait for a request before the SDK is ready. If this time expires, JS Sdk will retry 'retriesOnFailureBeforeReady' times before notifying its failure to be 'ready'.
       * @property {number} requestTimeoutBeforeReady
       * @default 0.8
       */
      requestTimeoutBeforeReady?: number,
      /**
       * How many quick retries we will do while starting up the SDK.
       * @property {number} retriesOnFailureBeforeReady
       * @default 1
       */
      retriesOnFailureBeforeReady?: number,
      /**
       * For SDK posts the queued events data in bulks with a given rate, but the first push window is defined separately,
       * to better control on browsers. This number defines that window before the first events push.
       *
       * @property {number} eventsFirstPushWindow
       * @default 10
       */
      eventsFirstPushWindow?: number,
    },
    /**
     * SDK Core settings for the browser.
     * @property {Object} core
     */
    core: {
      /**
       * Your API key. More information: @see {@link http://docs.split.io/docs/understanding-api-keys}
       * @property {string} authorizationKey
       */
      authorizationKey: string,
      /**
       * Customer identifier. Whatever this means to you. @see {@link http://docs.split.io/docs/selecting-the-traffic-type}
       * @property {SplitKey} key
       */
      key: SplitKey,
      /**
       * Traffic type associated with the customer identifier. @see {@link http://docs.split.io/docs/selecting-the-traffic-type}
       * If no provided as a setting it will be required on the client.track() calls.
       * @property {string} trafficType
       */
      trafficType?: string,
      /**
       * Disable labels from being sent to Split backend. Labels may contain sensitive information.
       * @property {boolean} labelsEnabled
       * @default true
       */
      labelsEnabled?: boolean
    },
    /**
     * Mocked features map. For testing purposses only. For using this you should specify "localhost" as authorizationKey on core settings.
     * @see {@link http://docs.split.io/docs/javascript-sdk-overview#section-running-the-sdk-in-off-the-grid-mode}
     */
    features?: MockedFeaturesMap,
    /**
     * Defines which kind of storage we should instanciate.
     * @property {Object} storage
     */
    storage?: {
      /**
       * Storage type to be instantiated by the SDK.
       * @property {BrowserStorage} type
       * @default MEMORY
       */
      type?: BrowserStorage,
      /**
       * Optional prefix to prevent any kind of data collision between SDK versions.
       * @property {string} prefix
       * @default SPLITIO
       */
      prefix?: string
    }
  }
  /**
   * Settings interface for SDK instances created on NodeJS.
   * If your storage is asynchronous (Redis for example) use SplitIO.INodeAsyncSettings instead.
   * @interface INodeSettings
   * @extends INodeBasicSettings
   * @see {@link http://docs.split.io/docs/nodejs-sdk-overview#section-advanced-configuration-of-the-sdk}
   */
  interface INodeSettings extends INodeBasicSettings {
    /**
     * Defines which kind of storage we should instanciate.
     * @property {Object} storage
     */
    storage?: {
      /**
       * Synchronous storage type to be instantiated by the SDK.
       * @property {NodeSyncStorage} type
       * @default MEMORY
       */
      type?: NodeSyncStorage,
      /**
       * Optional prefix to prevent any kind of data collision between SDK versions.
       * @property {string} prefix
       * @default SPLITIO
       */
      prefix?: string
    }
  }
  /**
   * Settings interface with async storage for SDK instances created on NodeJS.
   * If your storage is synchronous (by defaut we use memory, which is sync) use SplitIO.INodeSyncSettings instead.
   * @interface INodeAsyncSettings
   * @extends INodeBasicSettings
   * @see {@link http://docs.split.io/docs/nodejs-sdk-overview#section-advanced-configuration-of-the-sdk}
   */
  interface INodeAsyncSettings extends INodeBasicSettings {
    storage: {
      /**
       * Redis storage type to be instantiated by the SDK.
       * @property {NodeAsyncStorage} type
       */
      type: NodeAsyncStorage,
      /**
       * Options to be passed to the selected storage. Use it with type: 'REDIS'
       * @property {Object} options
       */
      options?: Object,
      /**
       * Optional prefix to prevent any kind of data collision between SDK versions.
       * @property {string} prefix
       * @default SPLITIO
       */
      prefix?: string
    }
  }
  /**
   * This represents the interface for the SDK instance with synchronous storage.
   * @interface ISDK
   * @extends IBasicSDK
   */
  interface ISDK extends IBasicSDK {
    /**
     * Returns the default client instance of the SDK.
     * @function client
     * @returns {IClient} The client instance.
     */
    client(): IClient,
    /**
     * Returns a shared client of the SDK. For usage on the browser.
     * @function client
     * @param {SplitKey} key The key for the new client instance.
     * @param {string=} trafficType The traffic type of the provided key.
     * @returns {IClient} The client instance.
     */
    client(key: SplitKey, trafficType?: string): IClient,
    /**
     * Returns a manager instance of the SDK to explore available information.
     * @function manager
     * @returns {IManager} The manager instance.
     */
    manager(): IManager
  }
  /**
   * This represents the interface for the SDK instance with asynchronous storage.
   * @interface IAsyncSDK
   * @extends IBasicSDK
   */
  interface IAsyncSDK extends IBasicSDK {
    /**
     * Returns the default client instance of the SDK.
     * @function client
     * @returns {IAsyncClient} The asynchronous client instance.
     */
    client(): IAsyncClient,
    /**
     * Returns a manager instance of the SDK to explore available information.
     * @function manager
     * @returns {IManager} The manager instance.
     */
    manager(): IAsyncManager
  }
  /**
   * This represents the interface for the Client instance with synchronous storage.
   * @interface IClient
   * @extends IBasicClient
   */
  interface IClient extends IBasicClient {
    /**
     * Returns a Treatment value, which will be (or eventually be) the treatment string for the given feature.
     * For usage on NodeJS as we don't have only one key.
     * NOTE: Treatment will be a promise only in async storages, like REDIS.
     * @function getTreatment
     * @param {string} key - The string key representing the consumer.
     * @param {string} splitName - The string that represents the split we wan't to get the treatment.
     * @param {Attributes=} attributes - An object of type Attributes defining the attributes for the given key.
     * @returns {Treatment} The treatment or treatment promise which will resolve to the treatment string.
     */
    getTreatment(key: SplitKey, splitName: string, attributes?: Attributes): Treatment,
    /**
     * Returns a Treatment value, which will be (or eventually be) the treatment string for the given feature.
     * For usage on the Browser as we defined the key on the settings.
     * NOTE: Treatment will be a promise only in async storages, like REDIS.
     * @function getTreatment
     * @param {string} splitName - The string that represents the split we wan't to get the treatment.
     * @param {Attributes=} attributes - An object of type Attributes defining the attributes for the given key.
     * @returns {Treatment} The treatment or treatment promise which will resolve to the treatment string.
     */
    getTreatment(splitName: string, attributes?: Attributes): Treatment,
    /**
     * Returns a Treatments value, whick will be (or eventually be) an object with the treatments for the given features.
     * For usage on NodeJS as we don't have only one key.
     * NOTE: Treatment will be a promise only in async storages, like REDIS.
     * @function getTreatments
     * @param {string} key - The string key representing the consumer.
     * @param {Array<string>} splitNames - An array of the split names we wan't to get the treatments.
     * @param {Attributes=} attributes - An object of type Attributes defining the attributes for the given key.
     * @returns {Treatments} The treatments or treatments promise which will resolve to the treatments object.
     */
    getTreatments(key: SplitKey, splitNames: string[], attributes?: Attributes): Treatments,
    /**
     * Returns a Treatments value, whick will be (or eventually be) an object with the treatments for the given features.
     * For usage on the Browser as we defined the key on the settings.
     * NOTE: Treatment will be a promise only in async storages, like REDIS.
     * @function getTreatments
     * @param {Array<string>} splitNames - An array of the split names we wan't to get the treatments.
     * @param {Attributes=} attributes - An object of type Attributes defining the attributes for the given key.
     * @returns {Treatments} The treatments or treatments promise which will resolve to the treatments object.
     */
    getTreatments(splitNames: string[], attributes?: Attributes): Treatments
  }
  /**
   * This represents the interface for the Client instance with asynchronous storage.
   * @interface IAsyncClient
   * @extends IBasicClient
   */
  interface IAsyncClient extends IBasicClient {
    /**
     * Returns a Treatment value, which will be (or eventually be) the treatment string for the given feature.
     * For usage on NodeJS as we don't have only one key.
     * NOTE: Treatment will be a promise only in async storages, like REDIS.
     * @function getTreatment
     * @param {string} key - The string key representing the consumer.
     * @param {string} splitName - The string that represents the split we wan't to get the treatment.
     * @param {Attributes=} attributes - An object of type Attributes defining the attributes for the given key.
     * @returns {Treatment} The treatment or treatment promise which will resolve to the treatment string.
     */
    getTreatment(key: SplitKey, splitName: string, attributes?: Attributes): AsyncTreatment,
    /**
     * Returns a Treatment value, which will be (or eventually be) the treatment string for the given feature.
     * For usage on the Browser as we defined the key on the settings.
     * NOTE: Treatment will be a promise only in async storages, like REDIS.
     * @function getTreatment
     * @param {string} splitName - The string that represents the split we wan't to get the treatment.
     * @param {Attributes=} attributes - An object of type Attributes defining the attributes for the given key.
     * @returns {Treatment} The treatment or treatment promise which will resolve to the treatment string.
     */
    getTreatment(splitName: string, attributes?: Attributes): AsyncTreatment,
    /**
     * Returns a Treatments value, whick will be (or eventually be) an object with the treatments for the given features.
     * For usage on NodeJS as we don't have only one key.
     * @function getTreatments
     * @param {string} key - The string key representing the consumer.
     * @param {Array<string>} splitNames - An array of the split names we wan't to get the treatments.
     * @param {Attributes=} attributes - An object of type Attributes defining the attributes for the given key.
     * @returns {Treatments} The treatments or treatments promise which will resolve to the treatments object.
     */
    getTreatments(key: SplitKey, splitNames: string[], attributes?: Attributes): AsyncTreatments,
    /**
     * Returns a Treatments value, whick will be (or eventually be) an object with the treatments for the given features.
     * For usage on the Browser as we defined the key on the settings.
     * @function getTreatments
     * @param {Array<string>} splitNames - An array of the split names we wan't to get the treatments.
     * @param {Attributes=} attributes - An object of type Attributes defining the attributes for the given key.
     * @returns {Treatments} The treatments or treatments promise which will resolve to the treatments object.
     */
    getTreatments(splitNames: string[], attributes?: Attributes): AsyncTreatments
  }
  /**
   * Representation of a manager instance with synchronous storage of the SDK.
   * @interface IManager
   * @extends IBasicManager
   */
  interface IManager extends IBasicManager {
    /**
     * Get the array of splits data in SplitView format.
     * @function splits
     * @returns {SplitViews} The list of SplitIO.SplitView.
     */
    splits(): SplitViews;
    /**
     * Get the data of a split in SplitView format.
     * @function split
     * @param {string} splitName The name of the split we wan't to get info of.
     * @returns {SplitView} The SplitIO.SplitView of the given split.
     */
    split(splitName: string): SplitView;
  }
  /**
   * Representation of a manager instance with asynchronous storage of the SDK.
   * @interface IAsyncManager
   * @extends IBasicManager
   */
  interface IAsyncManager extends IBasicManager {
    /**
     * Get the array of splits data in SplitView format.
     * @function splits
     * @returns {SplitViewsAsync} A promise that will resolve to the SplitIO.SplitView list.
     */
    splits(): SplitViewsAsync;
    /**
     * Get the data of a split in SplitView format.
     * @function split
     * @param {string} splitName The name of the split we wan't to get info of.
     * @returns {SplitViewAsync} A promise that will resolve to the SplitIO.SplitView value.
     */
    split(splitName: string): SplitViewAsync;
  }
}
