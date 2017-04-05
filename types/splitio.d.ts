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
 * @typedef {(Promise<T>|T)} AsyncValue
 */
type AsyncValue<T> = Promise<T> | T;
/**
 * @typedef {(Promise<T[]>|T[])} AsyncValues
 */
type AsyncValues<T> = Promise<T[]> | T[];
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
 * Settings interface
 * @interface ISettings
 */
interface ISettings {
  readonly core: {
    authorizationKey: string,
    key: string,
    labelsEnabled: boolean
  },
  readonly mode: SDKMode,
  readonly scheduler: {
    featuresRefreshRate: number,
    impressionsRefreshRate: number,
    metricsRefreshRate: number,
    segmentsRefreshRate: number,
    offlineRefreshRate: number
  },
  readonly startup: {
    readyTimeout: number,
    requestTimeoutBeforeReady: number,
    retriesOnFailureBeforeReady: number
  },
  readonly storage: {
    options: {
      prefix: string,
      type: StorageType
    }
  },
  readonly urls: {
    events: string,
    sdk: string
  },
  readonly version: string,
  features: {
    [featureName: string]: string
  }
}
/**
 * Types and interfaces for @splitsoftware/splitio package for usage when integrating javascript sdk on typescript apps.
 * For the SDK package information
 * @see {@link https://www.npmjs.com/package/@splitsoftware/splitio}
 */
declare namespace SplitIO {
  /**
   * Split treatment value, returned by getTreatment.
   * @typedef {AsyncValue<string>} Treatment
   */
  type Treatment = AsyncValue<string>;
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
    [attributeName: string]: string | number
  };
  /**
   * The SplitKey object format.
   * @typedef {Object} SplitKeyObject
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
  type SplitViewData = {
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
   * The SplitView or a promise that will be resolved with that SplitView.
   * @typedef {AsyncValue<SplitViewData>} SplitView
   */
  type SplitView = AsyncValue<SplitViewData>;
  /**
   * An array containing the SplitViews or a promise that will be resolved with that array.
   * @typedef {AsyncValues<SplitViewData>} SplitViews
   */
  type SplitViews = AsyncValues<SplitViewData>;
  /**
   * An array of split names.
   * @typedef {Array<string>} SplitNames
   */
  type SplitNames = Array<string>;
  /**
   * Storage valid types for NodeJS.
   * @typedef {string} NodeStorage
   */
  type NodeStorage = 'MEMORY' | 'LOCALSTORAGE' | 'REDIS';
  /**
   * Storage valid types for the browser.
   * @typedef {string} BrowserStorage
   */
  type BrowserStorage = 'MEMORY' | 'LOCALSTORAGE';
  /**
   * Settings interface for SDK instances created on the browser
   * @interface IBrowserSettings
   * @see {@link http://docs.split.io/docs/javascript-sdk-overview#section-advanced-configuration-of-the-sdk}
   */
  interface IBrowserSettings {
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
       * @property {string} key
       */
      key: string,
      /**
       * Disable labels from being sent to Split backend. Labels may contain sensitive information.
       * @property {boolean} labelsEnabled
       * @default true
       */
      labelsEnabled?: boolean
    },
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
       * For mocking/testing only. The SDK will refresh the features mocked data when mode is set to "localhost" by defining the key.
       * For more information @see {@link http://docs.split.io/docs/javascript-sdk-overview#section-running-the-sdk-in-off-the-grid-mode}
       * @property {number} offlineRefreshRate
       * @default 15
       */
      offlineRefreshRate?: number
    },
    /**
     * SDK Startup settings.
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
      retriesOnFailureBeforeReady?: number
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
   * Settings interface for SDK instances created on NodeJS
   * @interface INodeSettings
   * @see {@link http://docs.split.io/docs/nodejs-sdk-overview#section-advanced-configuration-of-the-sdk}
   */
  interface INodeSettings {
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
       * For mocking/testing only. The SDK will refresh the features mocked data when mode is set to "localhost" by defining the key.
       * For more information @see {@link http://docs.split.io/docs/nodejs-sdk-overview#section-running-the-sdk-in-off-the-grid-mode}
       * @property {number} offlineRefreshRate
       * @default 15
       */
      offlineRefreshRate?: number
    },
    /**
     * Defines which kind of storage we should instanciate.
     * @property {Object} storage
     */
    storage?: {
      /**
       * Storage type to be instantiated by the SDK.
       * @property {NodeStorage} type
       * @default MEMORY
       */
      type?: NodeStorage,
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
    features?: MockedFeaturesFilePath
  }
  /**
   * This represents the interface for the SDK instance.
   * @interface ISDK
   */
  interface ISDK {
    /**
     * Current settings of the SDK instance.
     * @property settings
     */
    settings: ISettings,
    /**
     * Returns a client instance of the SDK. If a key is provided as parameter, the function will return a shared instance. If no key param is provided, we will get the default instance.
     * @function client
     * @param {SplitKey=} key The key for the new client instance.
     * @returns {IClient} The client instance.
     */
    client(key?: SplitKey): IClient,
    /**
     * Returns a manager instance of the SDK to explore available information.
     * @function manager
     * @returns {IManager} The manager instance.
     */
    manager(): IManager
  }
  /**
   * Representation of a client instance of the SDK.
   * @interface IClient
   * @extends NodeJS.Events
   */
  interface IClient extends NodeJS.Events {
    /**
     * Constant object containing the SDK events for you to use.
     * @property {EventConsts} Event
     */
    Event: EventConsts,
    /**
     * Returns a Treatment value, which will be (or eventually be) the treatment string for the given feature.
     * For usage on NodeJS as we don't have only one key.
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
     * @function getTreatment
     * @param {string} splitName - The string that represents the split we wan't to get the treatment.
     * @param {Attributes=} attributes - An object of type Attributes defining the attributes for the given key.
     * @returns {Treatment} The treatment or treatment promise which will resolve to the treatment string.
     */
    getTreatment(splitName: string, attributes?: Attributes): Treatment,
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
     * @returns {void}
     */
    destroy(): void
  }
  /**
   * Representation of a manager instance of the SDK.
   * @interface IManager
   */
  interface IManager {
    /**
     * Get the array of splits data in SplitView format.
     * @function splits
     * @returns {SplitViews} The list of SplitViews or a promise that will resolve to that list.
     */
    splits(): SplitViews;
    /**
     * Get the data of a split in SplitView format.
     * @function split
     * @param {string} splitName The name of the split we wan't to get info of.
     * @returns {SplitView} The SplitView of the given split or a promise that will resolve to the SplitView.
     */
    split(splitName: string): SplitView;
    /**
     * Returns the available split names in an array.
     * @function names
     * @returns {SplitNames} The array of split names or the promise that will be resolved with the array.
     */
    names(): SplitNames;
  }
}
