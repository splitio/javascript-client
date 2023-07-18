// Type definitions for JavaScript and NodeJS Split Software SDK
// Project: http://www.split.io/
// Definitions by: Nico Zelaya <https://github.com/NicoZelaya/>

/// <reference types="google.analytics" />
import { RedisOptions } from "ioredis";

export as namespace SplitIO;
export = SplitIO;

/**
 * NodeJS.EventEmitter interface
 * @see {@link https://nodejs.org/api/events.html}
 */
interface EventEmitter {
  addListener(event: string | symbol, listener: (...args: any[]) => void): this;
  on(event: string | symbol, listener: (...args: any[]) => void): this;
  once(event: string | symbol, listener: (...args: any[]) => void): this;
  removeListener(event: string | symbol, listener: (...args: any[]) => void): this;
  off(event: string | symbol, listener: (...args: any[]) => void): this;
  removeAllListeners(event?: string | symbol): this;
  setMaxListeners(n: number): this;
  getMaxListeners(): number;
  listeners(event: string | symbol): Function[];
  rawListeners(event: string | symbol): Function[];
  emit(event: string | symbol, ...args: any[]): boolean;
  listenerCount(type: string | symbol): number;
  // Added in Node 6...
  prependListener(event: string | symbol, listener: (...args: any[]) => void): this;
  prependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this;
  eventNames(): Array<string | symbol>;
}
/**
 * @typedef {Object} EventConsts
 * @property {string} SDK_READY The ready event.
 * @property {string} SDK_READY_FROM_CACHE The ready event when fired with cached data.
 * @property {string} SDK_READY_TIMED_OUT The timeout event.
 * @property {string} SDK_UPDATE The update event.
 */
type EventConsts = {
  SDK_READY: 'init::ready',
  SDK_READY_FROM_CACHE: 'init::cache-ready',
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
    labelsEnabled: boolean,
    IPAddressesEnabled: boolean
  },
  readonly mode: SDKMode,
  readonly scheduler: {
    featuresRefreshRate: number,
    impressionsRefreshRate: number,
    impressionsQueueSize: number,
    /**
     * @deprecated
     */
    metricsRefreshRate?: number,
    telemetryRefreshRate: number,
    segmentsRefreshRate: number,
    offlineRefreshRate: number,
    eventsPushRate: number,
    eventsQueueSize: number,
    pushRetryBackoffBase: number
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
    sdk: string,
    auth: string,
    streaming: string,
    telemetry: string
  },
  readonly debug: boolean | LogLevel,
  readonly version: string,
  /**
   * Mocked features map if using in browser, or mocked features file path string if using in NodeJS.
   */
  features: SplitIO.MockedFeaturesMap | SplitIO.MockedFeaturesFilePath,
  readonly streamingEnabled: boolean,
  readonly sync: {
    splitFilters: SplitIO.SplitFilter[],
    impressionsMode: SplitIO.ImpressionsMode,
    enabled: boolean
  }
  /**
   * User consent status if using in browser. Undefined if using in NodeJS.
   */
  readonly userConsent?: SplitIO.ConsentStatus
}
/**
 * Log levels.
 * @typedef {string} LogLevel
 */
type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'NONE';
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
  disable(): void,
  /**
   * Sets a log level for the SDK logs.
   * @function setLogLevel
   * @returns {void}
   */
  setLogLevel(logLevel: LogLevel): void,
  /**
   * Log level constants. Use this to pass them to setLogLevel function.
   */
  LogLevel: {
    [level in LogLevel]: LogLevel
  }
}
/**
 * User consent API
 * @interface IUserConsentAPI
 */
interface IUserConsentAPI {
  /**
   * Sets or updates the user consent status. Possible values are `true` and `false`, which represent user consent `'GRANTED'` and `'DECLINED'` respectively.
   * - `true ('GRANTED')`: the user has granted consent for tracking events and impressions. The SDK will send them to Split cloud.
   * - `false ('DECLINED')`: the user has declined consent for tracking events and impressions. The SDK will not send them to Split cloud.
   *
   * NOTE: calling this method updates the user consent at a factory level, affecting all clients of the same factory.
   *
   * @function setStatus
   * @param {boolean} userConsent The user consent status, true for 'GRANTED' and false for 'DECLINED'.
   * @returns {boolean} Whether the provided param is a valid value (i.e., a boolean value) or not.
   */
  setStatus(userConsent: boolean): boolean;
  /**
   * Gets the user consent status.
   *
   * @function getStatus
   * @returns {ConsentStatus} The user consent status.
   */
  getStatus(): SplitIO.ConsentStatus;
  /**
   * Consent status constants. Use this to compare with the getStatus function result.
   */
  Status: {
    [status in SplitIO.ConsentStatus]: SplitIO.ConsentStatus
  }
}
/**
 * Common settings between Browser and NodeJS settings interface.
 * @interface ISharedSettings
 */
interface ISharedSettings {
  /**
   * Whether the logger should be enabled or disabled by default.
   * @property {Boolean} debug
   * @default false
   */
  debug?: boolean | LogLevel,
  /**
   * The impression listener, which is optional. Whatever you provide here needs to comply with the SplitIO.IImpressionListener interface,
   * which will check for the logImpression method.
   * @property {IImpressionListener} impressionListener
   * @default undefined
   */
  impressionListener?: SplitIO.IImpressionListener,
  /**
   * Boolean flag to enable the streaming service as default synchronization mechanism. In the event of any issue with streaming,
   * the SDK would fallback to the polling mechanism. If false, the SDK would poll for changes as usual without attempting to use streaming.
   * @property {boolean} streamingEnabled
   * @default true
   */
  streamingEnabled?: boolean,
  /**
   * SDK synchronization settings.
   * @property {Object} sync
   */
  sync?: {
    /**
     * List of feature flag filters. These filters are used to fetch a subset of the feature flag definitions in your environment, in order to reduce the delay of the SDK to be ready.
     * This configuration is only meaningful when the SDK is working in "standalone" mode.
     *
     * At the moment, only one type of feature flag filter is supported: by name.
     *
     * Example:
     *  `splitFilter: [
     *    { type: 'byName', values: ['my_feature_flag_1', 'my_feature_flag_2'] }, // will fetch feature flags named 'my_feature_flag_1' and 'my_feature_flag_2'
     *  ]`
     * @property {SplitIO.SplitFilter[]} splitFilters
     */
    splitFilters?: SplitIO.SplitFilter[]
    /**
     * Impressions Collection Mode. Option to determine how impressions are going to be sent to Split servers.
     * Possible values are 'DEBUG', 'OPTIMIZED', and 'NONE'.
     * - DEBUG: will send all the impressions generated (recommended only for debugging purposes).
     * - OPTIMIZED: will send unique impressions to Split servers, avoiding a considerable amount of traffic that duplicated impressions could generate.
     * - NONE: will send unique keys evaluated per feature to Split servers instead of full blown impressions, avoiding a considerable amount of traffic that impressions could generate.
     *
     * @property {string} impressionsMode
     * @default 'OPTIMIZED'
     */
    impressionsMode?: SplitIO.ImpressionsMode,
    /**
     * Controls the SDK continuous synchronization flags.
     *
     * When `true` a running SDK will process rollout plan updates performed on the UI (default).
     * When false it'll just fetch all data upon init
     *
     * @property {boolean} enabled
     * @default true
     */
    enabled?: boolean
  }
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
     * @default 15
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
     * @default 1
     */
    retriesOnFailureBeforeReady?: number,
    /**
     * For SDK posts the queued events data in bulks with a given rate, but the first push window is defined separately,
     * to better control on browsers. This number defines that window before the first events push.
     *
     * @property {number} eventsFirstPushWindow
     * @default 0
     */
    eventsFirstPushWindow?: number,
  },
  /**
   * SDK scheduler settings.
   * @property {Object} scheduler
   */
  scheduler?: {
    /**
     * The SDK polls Split servers for changes to feature flag definitions. This parameter controls this polling period in seconds.
     * @property {number} featuresRefreshRate
     * @default 60
     */
    featuresRefreshRate?: number,
    /**
     * The SDK sends information on who got what treatment at what time back to Split servers to power analytics. This parameter controls how often this data is sent to Split servers. The parameter should be in seconds.
     * @property {number} impressionsRefreshRate
     * @default 300
     */
    impressionsRefreshRate?: number,
    /**
     * The maximum number of impression items we want to queue. If we queue more values, it will trigger a flush and reset the timer.
     * If you use a 0 here, the queue will have no maximum size.
     * @property {number} impressionsQueueSize
     * @default 30000
     */
    impressionsQueueSize?: number,
    /**
     * The SDK sends diagnostic metrics to Split servers. This parameters controls this metric flush period in seconds.
     * @property {number} metricsRefreshRate
     * @default 120
     * @deprecated This parameter is ignored now. Use `telemetryRefreshRate` instead.
     */
    metricsRefreshRate?: number,
    /**
     * The SDK sends diagnostic metrics to Split servers. This parameters controls this metric flush period in seconds.
     * @property {number} telemetryRefreshRate
     * @default 3600
     */
    telemetryRefreshRate?: number,
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
     * For more information @see {@link https://help.split.io/hc/en-us/articles/360020564931-Node-js-SDK#localhost-mode}
     * @property {number} offlineRefreshRate
     * @default 15
     */
    offlineRefreshRate?: number
    /**
     * When using streaming mode, seconds to wait before re attempting to connect for push notifications.
     * Next attempts follow intervals in power of two: base seconds, base x 2 seconds, base x 4 seconds, ...
     * @property {number} pushRetryBackoffBase
     * @default 1
     */
    pushRetryBackoffBase?: number,
  },
  /**
   * SDK Core settings for NodeJS.
   * @property {Object} core
   */
  core: {
    /**
     * Your SDK key. More information: @see {@link https://help.split.io/hc/en-us/articles/360019916211-API-keys}
     * @property {string} authorizationKey
     */
    authorizationKey: string,
    /**
     * Disable labels from being sent to Split backend. Labels may contain sensitive information.
     * @property {boolean} labelsEnabled
     * @default true
     */
    labelsEnabled?: boolean
    /**
     * Disable machine IP and Name from being sent to Split backend.
     * @property {boolean} IPAddressesEnabled
     * @default true
     */
    IPAddressesEnabled?: boolean
  },
  /**
   * Defines which kind of storage we should instantiate.
   * @property {Object} storage
   */
  storage?: {
    /**
     * Storage type to be instantiated by the SDK.
     * @property {StorageType} type
     * @default 'MEMORY'
     */
    type?: StorageType,
    /**
     * Options to be passed to the selected storage.
     * @property {Object} options
     */
    options?: Object,
    /**
     * Optional prefix to prevent any kind of data collision between SDK versions.
     * @property {string} prefix
     * @default 'SPLITIO'
     */
    prefix?: string
  },
  /**
   * The SDK mode. Possible values are "standalone", which is the default when using a synchronous storage, like 'MEMORY' and 'LOCALSTORAGE',
   * and "consumer", which must be set when using an asynchronous storage, like 'REDIS'. For "localhost" mode, use "localhost" as authorizationKey.
   * @property {SDKMode} mode
   * @default 'standalone'
   */
  mode?: SDKMode,
  /**
   * Mocked features file path. For testing purposses only. For using this you should specify "localhost" as authorizationKey on core settings.
   * @see {@link https://help.split.io/hc/en-us/articles/360020564931-Node-js-SDK#localhost-mode}
   * @property {MockedFeaturesFilePath} features
   * @default '$HOME/.split'
   */
  features?: SplitIO.MockedFeaturesFilePath,
}
/**
 * Common API for entities that expose status handlers.
 * @interface IStatusInterface
 * @extends EventEmitter
 */
interface IStatusInterface extends EventEmitter {
  /**
   * Constant object containing the SDK events for you to use.
   * @property {EventConsts} Event
   */
  Event: EventConsts,
  /**
   * Returns a promise that resolves once the SDK has finished loading (SDK_READY event emitted) or rejected if the SDK has timedout (SDK_READY_TIMED_OUT event emitted).
   * As it's meant to provide similar flexibility to the event approach, given that the SDK might be eventually ready after a timeout event, calling the `ready` method after the
   * SDK had timed out will return a new promise that should eventually resolve if the SDK gets ready.
   *
   * Caveats: the method was designed to avoid an unhandled Promise rejection if the rejection case is not handled, so that `onRejected` handler is optional when using promises.
   * However, when using async/await syntax, the rejection should be explicitly propagated like in the following example:
   * ```
   * try {
   *   await client.ready().catch((e) => { throw e; });
   *   // SDK is ready
   * } catch(e) {
   *   // SDK has timedout
   * }
   * ```
   *
   * @function ready
   * @returns {Promise<void>}
   */
  ready(): Promise<void>
}
/**
 * Common definitions between clients for different environments interface.
 * @interface IBasicClient
 * @extends IStatusInterface
 */
interface IBasicClient extends IStatusInterface {
  /**
   * Destroys the client instance.
   * In 'standalone' mode, this method will flush any pending impressions and events, and stop the synchronization of feature flag definitions with the backend.
   * In 'consumer' mode, this method will disconnect the SDK from the Redis or Pluggable storage.
   *
   * @function destroy
   * @returns {Promise<void>} A promise that resolves once the client is destroyed.
   */
  destroy(): Promise<void>
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
   * Feature flag treatment value, returned by getTreatment.
   * @typedef {string} Treatment
   */
  type Treatment = string;
  /**
   * Feature flag treatment promise that resolves to actual treatment value.
   * @typedef {Promise<string>} AsyncTreatment
   */
  type AsyncTreatment = Promise<string>;
  /**
   * An object with the treatments for a bulk of feature flags, returned by getTreatments. For example:
   *   {
   *     feature1: 'on',
   *     feature2: 'off
   *   }
   * @typedef {Object.<Treatment>} Treatments
   */
  type Treatments = {
    [featureName: string]: Treatment
  };
  /**
   * Feature flag treatments promise that resolves to the actual SplitIO.Treatments object.
   * @typedef {Promise<Treatments>} AsyncTreatments
   */
  type AsyncTreatments = Promise<Treatments>;
  /**
   * Feature flag evaluation result with treatment and configuration, returned by getTreatmentWithConfig.
   * @typedef {Object} TreatmentWithConfig
   * @property {string} treatment The treatment string
   * @property {string | null} config The stringified version of the JSON config defined for that treatment, null if there is no config for the resulting treatment.
   */
  type TreatmentWithConfig = {
    treatment: string,
    config: string | null
  };
  /**
   * Feature flag treatment promise that resolves to actual treatment with config value.
   * @typedef {Promise<TreatmentWithConfig>} AsyncTreatmentWithConfig
   */
  type AsyncTreatmentWithConfig = Promise<TreatmentWithConfig>;
  /**
   * An object with the treatments with configs for a bulk of feature flags, returned by getTreatmentsWithConfig.
   * Each existing configuration is a stringified version of the JSON you defined on the Split user interface. For example:
   *   {
   *     feature1: { treatment: 'on', config: null }
   *     feature2: { treatment: 'off', config: '{"bannerText":"Click here."}' }
   *   }
   * @typedef {Object.<TreatmentWithConfig>} Treatments
   */
  type TreatmentsWithConfig = {
    [featureName: string]: TreatmentWithConfig
  };
  /**
   * Feature flag treatments promise that resolves to the actual SplitIO.TreatmentsWithConfig object.
   * @typedef {Promise<TreatmentsWithConfig>} AsyncTreatmentsWithConfig
   */
  type AsyncTreatmentsWithConfig = Promise<TreatmentsWithConfig>;
  /**
   * Possible Split SDK events.
   * @typedef {string} Event
   */
  type Event = 'init::timeout' | 'init::ready' | 'init::cache-ready' | 'state::update';
  /**
   * Attributes should be on object with values of type string, boolean, number (dates should be sent as millis since epoch) or array of strings or numbers.
   * @typedef {Object.<AttributeType>} Attributes
   * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#attribute-syntax}
   */
  type Attributes = {
    [attributeName: string]: AttributeType
  };
  /**
   * Type of an attribute value
   * @typedef {string | number | boolean | Array<string | number>} AttributeType
   */
  type AttributeType = string | number | boolean | Array<string | number>;
  /**
   * Properties should be an object with values of type string, number, boolean or null. Size limit of ~31kb.
   * @typedef {Object.<number, string, boolean, null>} Properties
   * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#track
   */
  type Properties = {
    [propertyName: string]: string | number | boolean | null
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
    [featureName: string]: string | TreatmentWithConfig
  };
  /**
   * Object with information about an impression. It contains the generated impression DTO as well as
   * complementary information around where and how it was generated in that way.
   * @typedef {Object} ImpressionData
   */
  type ImpressionData = {
    impression: {
      feature: string,
      keyName: string,
      treatment: string,
      time: number,
      bucketingKey?: string,
      label: string,
      changeNumber: number,
      pt?: number,
    },
    attributes?: SplitIO.Attributes,
    ip: string,
    hostname: string,
    sdkLanguageVersion: string
  };
  /**
   * Data corresponding to one feature flag view.
   * @typedef {Object} SplitView
   */
  type SplitView = {
    /**
     * The name of the feature flag.
     * @property {string} name
     */
    name: string,
    /**
     * The traffic type of the feature flag.
     * @property {string} trafficType
     */
    trafficType: string,
    /**
     * Whether the feature flag is killed or not.
     * @property {boolean} killed
     */
    killed: boolean,
    /**
     * The list of treatments available for the feature flag.
     * @property {Array<string>} treatments
     */
    treatments: Array<string>,
    /**
     * Current change number of the feature flag.
     * @property {number} changeNumber
     */
    changeNumber: number,
    /**
     * Map of configurations per treatment.
     * Each existing configuration is a stringified version of the JSON you defined on the Split user interface.
     * @property {Object.<string>} configs
     */
    configs: {
      [treatmentName: string]: string
    }
  };
  /**
   * A promise that resolves to a feature flag view.
   * @typedef {Promise<SplitView>} SplitView
   */
  type SplitViewAsync = Promise<SplitView>;
  /**
   * An array containing the SplitIO.SplitView elements.
   */
  type SplitViews = Array<SplitView>;
  /**
   * A promise that resolves to an SplitIO.SplitViews array.
   * @typedef {Promise<SplitViews>} SplitViewsAsync
   */
  type SplitViewsAsync = Promise<SplitViews>;
  /**
   * An array of feature flag names.
   * @typedef {Array<string>} SplitNames
   */
  type SplitNames = Array<string>;
  /**
   * A promise that resolves to an array of feature flag names.
   * @typedef {Promise<SplitNames>} SplitNamesAsync
   */
  type SplitNamesAsync = Promise<SplitNames>;
  /**
   * Synchronous storage valid types for NodeJS.
   * @typedef {string} NodeSyncStorage
   */
  type NodeSyncStorage = 'MEMORY';
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
   * Impression listener interface. This is the interface that needs to be implemented
   * by the element you provide to the SDK as impression listener.
   * @interface IImpressionListener
   * @see {@link https://help.split.io/hc/en-us/articles/360020564931-Node-js-SDK#listener}
   */
  interface IImpressionListener {
    logImpression(data: SplitIO.ImpressionData): void
  }
  /**
   * A pair of user key and it's trafficType, required for tracking valid Split events.
   * @typedef {Object} Identity
   * @property {string} key The user key.
   * @property {string} trafficType The key traffic type.
   */
  type Identity = {
    key: string;
    trafficType: string;
  };
  /**
   * Object with information about a Split event.
   * @typedef {Object} EventData
   */
  type EventData = {
    eventTypeId: string;
    value?: number;
    properties?: Properties;
    trafficTypeName?: string;
    key?: string;
    timestamp?: number;
  };
  /**
   * Enable 'Google Analytics to Split' integration, to track Google Analytics hits as Split events.
   *
   * @see {@link https://help.split.io/hc/en-us/articles/360040838752#google-analytics-to-split}
   */
  interface IGoogleAnalyticsToSplitConfig {
    type: 'GOOGLE_ANALYTICS_TO_SPLIT',
    /**
     * Optional flag to filter GA hits from being tracked as Split events.
     * @property {boolean} hits
     * @default true
     */
    hits?: boolean,
    /**
     * Optional predicate used to define a custom filter for tracking GA hits as Split events.
     * For example, the following filter allows to track only 'event' hits:
     *  `(model) => model.get('hitType') === 'event'`
     * By default, all hits are tracked as Split events.
     */
    filter?: (model: UniversalAnalytics.Model) => boolean,
    /**
     * Optional function useful when you need to modify the Split event before tracking it.
     * This function is invoked with two arguments:
     * 1. the GA model object representing the hit.
     * 2. the default format of the mapped Split event instance.
     * The return value must be a Split event, that can be the second argument or a new object.
     *
     * For example, the following mapper adds a custom property to events:
     *  `(model, defaultMapping) => {
     *      defaultMapping.properties.someProperty = SOME_VALUE;
     *      return defaultMapping;
     *  }`
     */
    mapper?: (model: UniversalAnalytics.Model, defaultMapping: SplitIO.EventData) => SplitIO.EventData,
    /**
     * Optional prefix for EventTypeId, to prevent any kind of data collision between events.
     * @property {string} prefix
     * @default 'ga'
     */
    prefix?: string,
    /**
     * List of Split identities (key & traffic type pairs) used to track events.
     * If not provided, events are sent using the key and traffic type provided at SDK config
     */
    identities?: Identity[],
    /**
     * Optional flag to log an error if the `auto-require` script is not detected.
     * The auto-require script automatically requires the `splitTracker` plugin for created trackers,
     * and should be placed right after your Google Analytics, Google Tag Manager or gtag.js script tag.
     *
     * @see {@link https://help.split.io/hc/en-us/articles/360040838752#set-up-with-gtm-and-gtag.js}
     *
     * @property {boolean} autoRequire
     * @default false
     */
    autoRequire?: boolean,
  }
  /**
   * Object representing the data sent by Split (events and impressions).
   * @typedef {Object} IntegrationData
   * @property {string} type The type of Split data, either 'IMPRESSION' or 'EVENT'.
   * @property {ImpressionData | EventData} payload The data instance itself.
   */
  type IntegrationData = { type: 'IMPRESSION', payload: SplitIO.ImpressionData } | { type: 'EVENT', payload: SplitIO.EventData };
  /**
   * Enable 'Split to Google Analytics' integration, to track Split impressions and events as Google Analytics hits.
   *
   * @see {@link https://help.split.io/hc/en-us/articles/360040838752#split-to-google-analytics}
   */
  interface ISplitToGoogleAnalyticsConfig {
    type: 'SPLIT_TO_GOOGLE_ANALYTICS',
    /**
     * Optional flag to filter Split impressions from being tracked as GA hits.
     * @property {boolean} impressions
     * @default true
     */
    impressions?: boolean,
    /**
     * Optional flag to filter Split events from being tracked as GA hits.
     * @property {boolean} events
     * @default true
     */
    events?: boolean,
    /**
     * Optional predicate used to define a custom filter for tracking Split data (events and impressions) as GA hits.
     * For example, the following filter allows to track only impressions, equivalent to setting events to false:
     *  `(data) => data.type === 'IMPRESSION'`
     */
    filter?: (data: SplitIO.IntegrationData) => boolean,
    /**
     * Optional function useful when you need to modify the GA hit before sending it.
     * This function is invoked with two arguments:
     * 1. the input data (Split event or impression).
     * 2. the default format of the mapped FieldsObject instance (GA hit).
     * The return value must be a FieldsObject, that can be the second argument or a new object.
     *
     * For example, the following mapper adds a custom dimension to hits:
     *  `(data, defaultMapping) => {
     *      defaultMapping.dimension1 = SOME_VALUE;
     *      return defaultMapping;
     *  }`
     *
     * Default FieldsObject instance for data.type === 'IMPRESSION':
     *  `{
     *    hitType: 'event',
     *    eventCategory: 'split-impression',
     *    eventAction: 'Evaluate ' + data.payload.impression.feature,
     *    eventLabel: 'Treatment: ' + data.payload.impression.treatment + '. Targeting rule: ' + data.payload.impression.label + '.',
     *    nonInteraction: true,
     *  }`
     * Default FieldsObject instance for data.type === 'EVENT':
     *  `{
     *    hitType: 'event',
     *    eventCategory: 'split-event',
     *    eventAction: data.payload.eventTypeId,
     *    eventValue: data.payload.value,
     *    nonInteraction: true,
     *  }`
     */
    mapper?: (data: SplitIO.IntegrationData, defaultMapping: UniversalAnalytics.FieldsObject) => UniversalAnalytics.FieldsObject,
    /**
     * List of tracker names to send the hit. An empty string represents the default tracker.
     * If not provided, hits are only sent to default tracker.
     */
    trackerNames?: string[],
  }
  /**
   * Available URL settings for the SDKs.
   */
  type UrlSettings = {
    /**
     * String property to override the base URL where the SDK will get rollout plan related data, like feature flags and segments definitions.
     * @property {string} sdk
     * @default 'https://sdk.split.io/api'
     */
    sdk?: string,
    /**
     * String property to override the base URL where the SDK will post event-related information like impressions.
     * @property {string} events
     * @default 'https://events.split.io/api'
     */
    events?: string,
    /**
     * String property to override the base URL where the SDK will get authorization tokens to be used with functionality that requires it, like streaming.
     * @property {string} auth
     * @default 'https://auth.split.io/api'
     */
    auth?: string,
    /**
     * String property to override the base URL where the SDK will connect to receive streaming updates.
     * @property {string} streaming
     * @default 'https://streaming.split.io'
     */
    streaming?: string,
    /**
     * String property to override the base URL where the SDK will post telemetry data.
     * @property {string} telemetry
     * @default 'https://telemetry.split.io/api'
     */
    telemetry?: string
  };

  /**
   * Available integration options for the browser
   */
  type BrowserIntegration = ISplitToGoogleAnalyticsConfig | IGoogleAnalyticsToSplitConfig;
  /**
   * SplitFilter type.
   *
   * @typedef {string} SplitFilterType
   */
  type SplitFilterType = 'byName' | 'byPrefix';
  /**
   * Defines a feature flag filter, described by a type and list of values.
   */
  interface SplitFilter {
    /**
     * Type of the filter.
     *
     * @property {SplitFilterType} type
     */
    type: SplitFilterType,
    /**
     * List of values: feature flag names for 'byName' filter type, and feature flag name prefixes for 'byPrefix' type.
     *
     * @property {string[]} values
     */
    values: string[],
  }
  /**
  * ImpressionsMode type
  * @typedef {string} ImpressionsMode
  */
  type ImpressionsMode = 'OPTIMIZED' | 'DEBUG' | 'NONE';
  /**
   * User consent status.
   * @typedef {string} ConsentStatus
   */
  type ConsentStatus = 'GRANTED' | 'DECLINED' | 'UNKNOWN';
  /**
   * Settings interface for SDK instances created on the browser
   * @interface IBrowserSettings
   * @extends ISharedSettings
   * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#configuration}
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
       * @default 1.5
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
     * SDK scheduler settings.
     * @property {Object} scheduler
     */
    scheduler?: {
      /**
       * The SDK polls Split servers for changes to feature flag definitions. This parameter controls this polling period in seconds.
       * @property {number} featuresRefreshRate
       * @default 60
       */
      featuresRefreshRate?: number,
      /**
       * The SDK sends information on who got what treatment at what time back to Split servers to power analytics. This parameter controls how often this data is sent to Split servers. The parameter should be in seconds.
       * @property {number} impressionsRefreshRate
       * @default 60
       */
      impressionsRefreshRate?: number,
      /**
       * The maximum number of impression items we want to queue. If we queue more values, it will trigger a flush and reset the timer.
       * If you use a 0 here, the queue will have no maximum size.
       * @property {number} impressionsQueueSize
       * @default 30000
       */
      impressionsQueueSize?: number,
      /**
       * The SDK sends diagnostic metrics to Split servers. This parameters controls this metric flush period in seconds.
       * @property {number} metricsRefreshRate
       * @default 120
       * @deprecated This parameter is ignored now. Use `telemetryRefreshRate` instead.
       */
      metricsRefreshRate?: number,
      /**
       * The SDK sends diagnostic metrics to Split servers. This parameters controls this metric flush period in seconds.
       * @property {number} telemetryRefreshRate
       * @default 3600
       */
      telemetryRefreshRate?: number,
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
       * For more information @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#localhost-mode}
       * @property {number} offlineRefreshRate
       * @default 15
       */
      offlineRefreshRate?: number,
      /**
       * When using streaming mode, seconds to wait before re attempting to connect for push notifications.
       * Next attempts follow intervals in power of two: base seconds, base x 2 seconds, base x 4 seconds, ...
       * @property {number} pushRetryBackoffBase
       * @default 1
       */
      pushRetryBackoffBase?: number,
    },
    /**
     * SDK Core settings for the browser.
     * @property {Object} core
     */
    core: {
      /**
       * Your SDK key. More information: @see {@link https://help.split.io/hc/en-us/articles/360019916211-API-keys}
       * @property {string} authorizationKey
       */
      authorizationKey: string,
      /**
       * Customer identifier. Whatever this means to you. @see {@link https://help.split.io/hc/en-us/articles/360019916311-Traffic-type}
       * @property {SplitKey} key
       */
      key: SplitKey,
      /**
       * Traffic type associated with the customer identifier. @see {@link https://help.split.io/hc/en-us/articles/360019916311-Traffic-type}
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
     * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#localhost-mode}
     */
    features?: MockedFeaturesMap,
    /**
     * Defines which kind of storage we can instantiate on the browser.
     * Possible storage types are 'MEMORY', which is the default, and 'LOCALSTORAGE'.
     * @property {Object} storage
     */
    storage?: {
      /**
       * Storage type to be instantiated by the SDK.
       * @property {BrowserStorage} type
       * @default 'MEMORY'
       */
      type?: BrowserStorage,
      /**
       * Optional prefix to prevent any kind of data collision between SDK versions.
       * @property {string} prefix
       * @default 'SPLITIO'
       */
      prefix?: string
    },
    /**
     * List of URLs that the SDK will use as base for it's synchronization functionalities, applicable only when running as standalone.
     * Do not change these settings unless you're working an advanced use case, like connecting to the Split proxy.
     * @property {Object} urls
     */
    urls?: UrlSettings,
    /**
     * SDK integration settings for the Browser.
     * @property {Object} integrations
     */
    integrations?: BrowserIntegration[],
    /**
     * User consent status. Possible values are `'GRANTED'`, which is the default, `'DECLINED'` or `'UNKNOWN'`.
     * - `'GRANTED'`: the user grants consent for tracking events and impressions. The SDK sends them to Split cloud.
     * - `'DECLINED'`: the user declines consent for tracking events and impressions. The SDK does not send them to Split cloud.
     * - `'UNKNOWN'`: the user neither grants nor declines consent for tracking events and impressions. The SDK tracks them in its internal storage, and eventually either sends
     * them or not if the consent status is updated to 'GRANTED' or 'DECLINED' respectively. The status can be updated at any time with the `UserConsent.setStatus` factory method.
     *
     * @typedef {string} userConsent
     * @default 'GRANTED'
     */
    userConsent?: ConsentStatus
  }
  /**
   * Settings interface for SDK instances created on NodeJS.
   * If your storage is asynchronous (Redis for example) use SplitIO.INodeAsyncSettings instead.
   * @interface INodeSettings
   * @extends INodeBasicSettings
   * @see {@link https://help.split.io/hc/en-us/articles/360020564931-Node-js-SDK#configuration}
   */
  interface INodeSettings extends INodeBasicSettings {
    /**
     * List of URLs that the SDK will use as base for it's synchronization functionalities, applicable only when running as standalone.
     * Do not change these settings unless you're working an advanced use case, like connecting to the Split proxy.
     * @property {Object} urls
     */
    urls?: UrlSettings,
    /**
     * Defines which kind of storage we can instantiate on NodeJS for 'standalone' mode.
     * The only possible storage type is 'MEMORY', which is the default.
     * @property {Object} storage
     */
    storage?: {
      /**
       * Synchronous storage type to be instantiated by the SDK.
       * @property {NodeSyncStorage} type
       * @default 'MEMORY'
       */
      type?: NodeSyncStorage,
      /**
       * Optional prefix to prevent any kind of data collision between SDK versions.
       * @property {string} prefix
       * @default 'SPLITIO'
       */
      prefix?: string
    },
    /**
     * The SDK mode. When using the default 'MEMORY' storage, the only possible value is "standalone", which is the default.
     * For "localhost" mode, use "localhost" as authorizationKey.
     *
     * @property {'standalone'} mode
     * @default 'standalone'
     */
    mode?: 'standalone'
  }
  /**
   * Settings interface with async storage for SDK instances created on NodeJS.
   * If your storage is synchronous (by defaut we use memory, which is sync) use SplitIO.INodeSettings instead.
   * @interface INodeAsyncSettings
   * @extends INodeBasicSettings
   * @see {@link https://help.split.io/hc/en-us/articles/360020564931-Node-js-SDK#configuration}
   */
  interface INodeAsyncSettings extends INodeBasicSettings {
    /**
     * Defines which kind of async storage we can instantiate on NodeJS for 'consumer' mode.
     * The only possible storage type is 'REDIS'.
     * @property {Object} storage
     */
    storage: {
      /**
       * 'REDIS' storage type to be instantiated by the SDK.
       * @property {NodeAsyncStorage} type
       */
      type: NodeAsyncStorage,
      /**
       * Options to be passed to the Redis storage. Use it with storage type: 'REDIS'.
       * @property {Object} options
       */
      options?: {
        /**
         * Redis URL. If set, `host`, `port`, `db` and `pass` params will be ignored.
         *
         * Examples:
         * ```
         *   url: 'localhost'
         *   url: '127.0.0.1:6379'
         *   url: 'redis://:authpassword@127.0.0.1:6379/0'
         * ```
         * @property {string=} url
         */
        url?: string,
        /**
         * Redis host.
         * @property {string=} host
         * @default 'localhost'
         */
        host?: string,
        /**
         * Redis port.
         * @property {number=} port
         * @default 6379
         */
        port?: number,
        /**
         * Redis database to be used.
         * @property {number=} db
         * @default 0
         */
        db?: number,
        /**
         * Redis password. Don't define if no password is used.
         * @property {string=} pass
         * @default undefined
         */
        pass?: string,
        /**
         * The milliseconds before a timeout occurs during the initial connection to the Redis server.
         * @property {number=} connectionTimeout
         * @default 10000
         */
        connectionTimeout?: number,
        /**
         * The milliseconds before Redis commands are timeout by the SDK.
         * Method calls that involve Redis commands, like `client.getTreatment` or `client.track` calls, are resolved when the commands success or timeout.
         * @property {number=} operationTimeout
         * @default 5000
         */
        operationTimeout?: number,
        /**
         * TLS configuration for Redis connection.
         * @see {@link https://www.npmjs.com/package/ioredis#tls-options }
         *
         * @property {Object=} tls
         * @default undefined
         */
        tls?: RedisOptions['tls'],
      },
      /**
       * Optional prefix to prevent any kind of data collision between SDK versions.
       * @property {string} prefix
       * @default 'SPLITIO'
       */
      prefix?: string
    },
    /**
     * The SDK mode. When using 'REDIS' storage type, the only possible value is "consumer", which is required.
     *
     * @see {@link https://help.split.io/hc/en-us/articles/360020564931-Node-js-SDK#state-sharing-redis-integration}
     *
     * @property {'consumer'} mode
     */
    mode: 'consumer'
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
   * This represents the interface for the SDK instance with synchronous storage.
   * @interface ISDK
   * @extends IBasicSDK
   */
  interface IBrowserSDK extends ISDK {
    /**
     * Returns the default client instance of the SDK.
     * @function client
     * @returns {IBrowserClient} The client instance.
     */
    client(): IBrowserClient,
    /**
     * Returns a shared client of the SDK. For usage on the browser.
     * @function client
     * @param {SplitKey} key The key for the new client instance.
     * @param {string=} trafficType The traffic type of the provided key.
     * @returns {IBrowserClient} The client instance.
     */
    client(key: SplitKey, trafficType?: string): IBrowserClient
    /**
     * User consent API.
     * @property UserConsent
     */
    UserConsent: IUserConsentAPI
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
     * Returns a Treatment value, which is the treatment string for the given feature.
     * For usage on NodeJS as we don't have only one key.
     * @function getTreatment
     * @param {string} key - The string key representing the consumer.
     * @param {string} featureFlagName - The string that represents the feature flag we want to get the treatment.
     * @param {Attributes=} attributes - An object of type Attributes defining the attributes for the given key.
     * @returns {Treatment} The treatment string.
     */
    getTreatment(key: SplitKey, featureFlagName: string, attributes?: Attributes): Treatment,
    /**
     * Returns a Treatment value, which is the treatment string for the given feature.
     * For usage on the Browser as we defined the key on the settings.
     * @function getTreatment
     * @param {string} featureFlagName - The string that represents the feature flag we want to get the treatment.
     * @param {Attributes=} attributes - An object of type Attributes defining the attributes for the given key.
     * @returns {Treatment} The treatment string.
     */
    getTreatment(featureFlagName: string, attributes?: Attributes): Treatment,
    /**
     * Returns a TreatmentWithConfig value, which is an object with both treatment and config string for the given feature.
     * For usage on NodeJS as we don't have only one key.
     * @function getTreatmentWithConfig
     * @param {string} key - The string key representing the consumer.
     * @param {string} featureFlagName - The string that represents the feature flag we want to get the treatment.
     * @param {Attributes=} attributes - An object of type Attributes defining the attributes for the given key.
     * @returns {TreatmentWithConfig} The TreatmentWithConfig, the object containing the treatment string and the
     *                                configuration stringified JSON (or null if there was no config for that treatment).
     */
    getTreatmentWithConfig(key: SplitKey, featureFlagName: string, attributes?: Attributes): TreatmentWithConfig,
    /**
     * Returns a TreatmentWithConfig value, which an object with both treatment and config string for the given feature.
     * For usage on the Browser as we defined the key on the settings.
     * @function getTreatment
     * @param {string} featureFlagName - The string that represents the feature flag we want to get the treatment.
     * @param {Attributes=} attributes - An object of type Attributes defining the attributes for the given key.
     * @returns {TreatmentWithConfig} The TreatmentWithConfig, the object containing the treatment string and the
     *                                configuration stringified JSON (or null if there was no config for that treatment).
     */
    getTreatmentWithConfig(featureFlagName: string, attributes?: Attributes): TreatmentWithConfig,
    /**
     * Returns a Treatments value, which is an object map with the treatments for the given features.
     * For usage on NodeJS as we don't have only one key.
     * NOTE: Treatment will be a promise only in async storages, like REDIS.
     * @function getTreatments
     * @param {string} key - The string key representing the consumer.
     * @param {Array<string>} featureFlagNames - An array of the feature flag names we want to get the treatments.
     * @param {Attributes=} attributes - An object of type Attributes defining the attributes for the given key.
     * @returns {Treatments} The treatments object map.
     */
    getTreatments(key: SplitKey, featureFlagNames: string[], attributes?: Attributes): Treatments,
    /**
     * Returns a Treatments value, which is an object map with the treatments for the given features.
     * For usage on the Browser as we defined the key on the settings.
     * NOTE: Treatment will be a promise only in async storages, like REDIS.
     * @function getTreatments
     * @param {Array<string>} featureFlagNames - An array of the feature flags names we want to get the treatments.
     * @param {Attributes=} attributes - An object of type Attributes defining the attributes for the given key.
     * @returns {Treatments} The treatments object map.
     */
    getTreatments(featureFlagNames: string[], attributes?: Attributes): Treatments,
    /**
     * Returns a TreatmentsWithConfig value, which is an object map with the TreatmentWithConfig (an object with both treatment and config string) for the given features.
     * For usage on NodeJS as we don't have only one key.
     * @function getTreatmentsWithConfig
     * @param {string} key - The string key representing the consumer.
     * @param {Array<string>} featureFlagNames - An array of the feature flag names we want to get the treatments.
     * @param {Attributes=} attributes - An object of type Attributes defining the attributes for the given key.
     * @returns {TreatmentsWithConfig} The map with all the TreatmentWithConfig objects
     */
    getTreatmentsWithConfig(key: SplitKey, featureFlagNames: string[], attributes?: Attributes): TreatmentsWithConfig,
    /**
     * Returns a TreatmentsWithConfig value, which is an object map with the TreatmentWithConfig (an object with both treatment and config string) for the given features.
     * For usage on the Browser as we defined the key on the settings.
     * @function getTreatmentsWithConfig
     * @param {Array<string>} featureFlagNames - An array of the feature flag names we want to get the treatments.
     * @param {Attributes=} attributes - An object of type Attributes defining the attributes for the given key.
     * @returns {TreatmentsWithConfig} The map with all the TreatmentWithConfig objects
     */
    getTreatmentsWithConfig(featureFlagNames: string[], attributes?: Attributes): TreatmentsWithConfig,
    /**
     * Tracks an event to be fed to the results product on Split user interface.
     * For usage on NodeJS as we don't have only one key.
     * @function track
     * @param {SplitKey} key - The key that identifies the entity related to this event.
     * @param {string} trafficType - The traffic type of the entity related to this event.
     * @param {string} eventType - The event type corresponding to this event.
     * @param {number=} value - The value of this event.
     * @param {Properties=} properties - The properties of this event. Values can be string, number, boolean or null.
     * @returns {boolean} Whether the event was added to the queue successfully or not.
     */
    track(key: SplitIO.SplitKey, trafficType: string, eventType: string, value?: number, properties?: Properties): boolean,
    /**
     * Tracks an event to be fed to the results product on Split user interface.
     * For usage on the Browser as we defined the key on the settings.
     * @function track
     * @param {string} trafficType - The traffic type of the entity related to this event.
     * @param {string} eventType - The event type corresponding to this event.
     * @param {number=} value - The value of this event.
     * @param {Properties=} properties - The properties of this event. Values can be string, number, boolean or null.
     * @returns {boolean} Whether the event was added to the queue successfully or not.
     */
    track(trafficType: string, eventType: string, value?: number, properties?: Properties): boolean,
    /**
     * Tracks an event to be fed to the results product on Split user interface.
     * For usage on the Browser if we defined the key and also the trafficType on the settings.
     * @function track
     * @param {string} eventType - The event type corresponding to this event.
     * @param {number=} value - The value of this event.
     * @param {Properties=} properties - The properties of this event. Values can be string, number, boolean or null.
     * @returns {boolean} Whether the event was added to the queue successfully or not.
     */
    track(eventType: string, value?: number, properties?: Properties): boolean
  }
  /**
   * This represents the interface for the Client instance with attributes binding.
   * @interface IBrowserClient
   * @Extends IClient
   */
  interface IBrowserClient extends IClient {
    /**
     * Add an attribute to client's in memory attributes storage.
     *
     * @param {string} attributeName Attribute name
     * @param {AttributeType} attributeValue Attribute value
     * @returns {boolean} true if the attribute was stored and false otherwise
     */
    setAttribute(attributeName: string, attributeValue: AttributeType): boolean,
    /**
     * Returns the attribute with the given name.
     *
     * @param {string} attributeName Attribute name
     * @returns {AttributeType} Attribute with the given name
     */
    getAttribute(attributeName: string): AttributeType,
    /**
     * Removes from client's in memory attributes storage the attribute with the given name.
     *
     * @param {string} attributeName
     * @returns {boolean} true if attribute was removed and false otherwise
     */
    removeAttribute(attributeName: string): boolean,
    /**
     * Add to client's in memory attributes storage the attributes in 'attributes'.
     *
     * @param {Attributes} attributes Object with attributes to store
     * @returns true if attributes were stored an false otherwise
     */
    setAttributes(attributes: Attributes): boolean,
    /**
     * Return all the attributes stored in client's in memory attributes storage.
     *
     * @returns {Attributes} returns all the stored attributes
     */
    getAttributes(): Attributes,
    /**
     * Remove all the stored attributes in the client's in memory attribute storage.
     *
     * @returns {boolean} true if all attribute were removed and false otherwise
     */
    clearAttributes(): boolean
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
     * @param {string} featureFlagName - The string that represents the feature flag we want to get the treatment.
     * @param {Attributes=} attributes - An object of type Attributes defining the attributes for the given key.
     * @returns {AsyncTreatment} Treatment promise that resolves to the treatment string.
     */
    getTreatment(key: SplitKey, featureFlagName: string, attributes?: Attributes): AsyncTreatment,
    /**
     * Returns a TreatmentWithConfig value, which will be (or eventually be) an object with both treatment and config string for the given feature.
     * For usage on NodeJS as we don't have only one key.
     * NOTE: Treatment will be a promise only in async storages, like REDIS.
     * @function getTreatmentWithConfig
     * @param {string} key - The string key representing the consumer.
     * @param {string} featureFlagName - The string that represents the feature flag we want to get the treatment.
     * @param {Attributes=} attributes - An object of type Attributes defining the attributes for the given key.
     * @returns {AsyncTreatmentWithConfig} TreatmentWithConfig promise that resolves to the TreatmentWithConfig object.
     */
    getTreatmentWithConfig(key: SplitKey, featureFlagName: string, attributes?: Attributes): AsyncTreatmentWithConfig,
    /**
     * Returns a Treatments value, which will be (or eventually be) an object map with the treatments for the given features.
     * For usage on NodeJS as we don't have only one key.
     * @function getTreatments
     * @param {string} key - The string key representing the consumer.
     * @param {Array<string>} featureFlagNames - An array of the feature flag names we want to get the treatments.
     * @param {Attributes=} attributes - An object of type Attributes defining the attributes for the given key.
     * @returns {AsyncTreatments} Treatments promise that resolves to the treatments object map.
     */
    getTreatments(key: SplitKey, featureFlagNames: string[], attributes?: Attributes): AsyncTreatments,
    /**
     * Returns a TreatmentsWithConfig value, which will be (or eventually be) an object map with the TreatmentWithConfig (an object with both treatment and config string) for the given features.
     * For usage on NodeJS as we don't have only one key.
     * @function getTreatmentsWithConfig
     * @param {string} key - The string key representing the consumer.
     * @param {Array<string>} featureFlagNames - An array of the feature flag names we want to get the treatments.
     * @param {Attributes=} attributes - An object of type Attributes defining the attributes for the given key.
     * @returns {AsyncTreatmentsWithConfig} TreatmentsWithConfig promise that resolves to the map of TreatmentsWithConfig objects.
     */
    getTreatmentsWithConfig(key: SplitKey, featureFlagNames: string[], attributes?: Attributes): AsyncTreatmentsWithConfig,
    /**
     * Tracks an event to be fed to the results product on Split user interface, and returns a promise to signal when the event was successfully queued (or not).
     * @function track
     * @param {SplitKey} key - The key that identifies the entity related to this event.
     * @param {string} trafficType - The traffic type of the entity related to this event.
     * @param {string} eventType - The event type corresponding to this event.
     * @param {number=} value - The value of this event.
     * @param {Properties=} properties - The properties of this event. Values can be string, number, boolean or null.
     * @returns {Promise<boolean>} A promise that resolves to a boolean indicating if the event was added to the queue successfully or not.
     */
    track(key: SplitIO.SplitKey, trafficType: string, eventType: string, value?: number, properties?: Properties): Promise<boolean>
  }
  /**
   * Representation of a manager instance with synchronous storage of the SDK.
   * @interface IManager
   * @extends IStatusInterface
   */
  interface IManager extends IStatusInterface {
    /**
     * Get the array of feature flag names.
     * @function names
     * @returns {SplitNames} The list of feature flag names.
     */
    names(): SplitNames;
    /**
     * Get the array of feature flags data in SplitView format.
     * @function splits
     * @returns {SplitViews} The list of SplitIO.SplitView.
     */
    splits(): SplitViews;
    /**
     * Get the data of a feature flag in SplitView format.
     * @function split
     * @param {string} featureFlagName The name of the feature flag we want to get info of.
     * @returns {SplitView | null} The SplitIO.SplitView of the given feature flag name or null if the feature flag is not found.
     */
    split(featureFlagName: string): SplitView | null;
  }
  /**
   * Representation of a manager instance with asynchronous storage of the SDK.
   * @interface IAsyncManager
   * @extends IStatusInterface
   */
  interface IAsyncManager extends IStatusInterface {
    /**
     * Get the array of feature flag names.
     * @function names
     * @returns {SplitNamesAsync} A promise that resolves to the list of feature flag names.
     */
    names(): SplitNamesAsync;
    /**
     * Get the array of feature flags data in SplitView format.
     * @function splits
     * @returns {SplitViewsAsync} A promise that resolves to the SplitIO.SplitView list.
     */
    splits(): SplitViewsAsync;
    /**
     * Get the data of a feature flag in SplitView format.
     * @function split
     * @param {string} featureFlagName The name of the feature flag we want to get info of.
     * @returns {SplitViewAsync} A promise that resolves to the SplitIO.SplitView value.
     */
    split(featureFlagName: string): SplitViewAsync;
  }
}
