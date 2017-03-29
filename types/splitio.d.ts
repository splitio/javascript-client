// Type definitions for Javascript and Node Split Software SDK v7.4.0
// Project: http://www.split.io/
// Definitions by: Nico Zelaya <https://github.com/NicoZelaya/>

/// <reference types="node" />

/**
 * @typedef {Object} EventConsts
 * @property {string} SDK_READY The ready event.
 * @property {string} SDK_READY_TIMED_OUT The timeout event.
 * @property {string} SDK_SEGMENTS_ARRIVED The event fired when segments info arrive to the SDK.
 * @property {string} SDK_SPLITS_ARRIVED The event fired when splits info arrive to the SDK.
 * @property {string} SDK_UPDATE The update event.
 * @property {string} SDK_UPDATE_ERROR The update error event.
 */
type EventConsts = {
  SDK_READY: 'init::ready',
  SDK_READY_TIMED_OUT: 'init::timeout',
  SDK_SEGMENTS_ARRIVED: 'state::segments-arrived',
  SDK_SPLITS_ARRIVED: 'state::splits-arrived',
  SDK_UPDATE: 'state::update',
  SDK_UPDATE_ERROR: 'state::update-error'
};
/**
 * @typedef {(Promise<T>|T)} AsyncTreatmentValue
 */
type AsyncTreatmentValue<T> = Promise<T> | T;
/**
 * @typedef {string} EventOpts
 */
type EventOpts = 'init::timeout' | 'init::ready' | 'state::update';
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
  readonly scheduler: {
    featuresRefreshRate: number,
    impressionsRefreshRate: number,
    metricsRefreshRate: number,
    segmentsRefreshRate: number
  },
  readonly startup: {
    readyTimeout: number,
    requestTimeoutBeforeReady: number,
    retriesOnFailureBeforeReady: number
  },
  readonly urls: {
    events: string,
    sdk: string
  },
  readonly version: string
}

/**
 * Types and interfaces for @splitsoftware/splitio package for usage when integrating javascript sdk on typescript apps.
 * For the SDK package information
 * @see {@link https://www.npmjs.com/package/@splitsoftware/splitio}
 */
declare namespace SplitIO {
  /**
   * Split treatment value, returned by getTreatment.
   * @typedef {AsyncTreatmentValue<string>} Treatment
   */
  type Treatment = AsyncTreatmentValue<string>;
  /**
   * Possible split events.
   * @typedef {EventOpts} Event
   */
  type Event = EventOpts;
  /**
   * Split attributes should be on object with values of type string or number (dates should be sent as millis since epoch).
   * @typedef {Object.<number, string>} Attributes
   * @see {@link http://docs.split.io/docs/javascript-sdk-overview#section-using-attributes-in-sdk}
   */
  type Attributes = {
    [attributeName: string]: string | number
  }
  /**
   * Settings interface for SDK instances created on the browser
   * @interface IBrowserSettings
   * @see {@link http://docs.split.io/docs/javascript-sdk-overview#section-advanced-configuration-of-the-sdk}
   */
  interface IBrowserSettings {
    /**
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
      segmentsRefreshRate?: number
    },
    /**
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
    }
  }
  /**
   * Settings interface for SDK instances created on NodeJS
   * @interface INodeSettings
   * @see {@link http://docs.split.io/docs/nodejs-sdk-overview#section-advanced-configuration-of-the-sdk}
   */
  interface INodeSettings {
    /**
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
      segmentsRefreshRate?: number
    }
  }
  /**
   * @interface ISDK
   * @extends NodeJS.Events
   * This represents the interface for the SDK instance.
   */
  interface ISDK extends NodeJS.Events {
    /**
     * Destroy the SDK instance.
     * @function destroy
     * @returns {void}
     */
    destroy(): void,
    /**
     * Returns a Treatment value, which will be (or eventually be) the treatment string for the given feature.
     * @function getTreatment
     * @param {string} key - The string key representing the consumer.
     * @param {string} featureName - The string that represents the split we wan't to get the treatment.
     * @param {Attributes=} attributes - An object of type Attributes defining the attributes for the given key.
     * @returns {Treatment} The treatment or treatment promise which will resolve to the treatment string.
     */
    getTreatment(key: string, featureName: string, attributes?: Attributes): Treatment,
    /**
     * Returns a Treatment value, which will be (or eventually be) the treatment string for the given feature.
     * @function getTreatment
     * @param {string} featureName The string that represents the split we wan't to get the treatment.
     * @param {Attributes=} attributes An object of type Attributes defining the attributes for the given key.
     * @returns {Treatment} The treatment or treatment promise which will resolve to the treatment string.
     */
    getTreatment(featureName: string, attributes?: Attributes): Treatment,
    /**
     * Returns a promise that will be resolved once the SDK has finished loading.
     * @function ready
     * @deprecated Use on(sdk.Event.SDK_READY, callback: () => void) instead.
     * @returns {Promise<void>}
     */
    ready(): Promise<void>,
    /**
     * Used for binding to the different SDK events
     * @function on
     * @param {Event} eventName The name of the event we wan't to subscribe a callback.
     * @param {Function} callback The callback to execute when the event is fired. It won't receive any parameters.
     * @returns {ISDK} The SDK instance.
     */
    on(eventName: Event, callback: () => any): this,
    /**
     * The settings object which respects the ISettings interface.
     */
    settings: ISettings,
    /**
     * An object containing the constants for the SDK available events.
     */
    Event: EventConsts
  }
}
