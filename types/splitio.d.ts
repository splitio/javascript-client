// Type definitions for Javascript and NodeJS Split Software SDK
// Project: http://www.split.io/
// Definitions by: Nico Zelaya <https://github.com/NicoZelaya/>

/// <reference types="@splitsoftware/splitio-commons/src/types" />

/**
 * NodeJS.EventEmitter interface
 * @see {@link https://nodejs.org/api/events.html}
 */
interface NodeJSEventEmitter extends SplitIO.IEventEmitter {
  addListener(event: string, listener: (...args: any[]) => void): this;
  on(event: string, listener: (...args: any[]) => void): this;
  once(event: string, listener: (...args: any[]) => void): this;
  removeListener(event: string, listener: (...args: any[]) => void): this;
  off(event: string, listener: (...args: any[]) => void): this;
  removeAllListeners(event?: string): this;
  setMaxListeners(n: number): this;
  getMaxListeners(): number;
  listeners(event: string): Function[];
  rawListeners(event: string): Function[];
  emit(event: string, ...args: any[]): boolean;
  listenerCount(type: string): number;
  // Added in Node 6...
  prependListener(event: string, listener: (...args: any[]) => void): this;
  prependOnceListener(event: string, listener: (...args: any[]) => void): this;
  eventNames(): Array<string | symbol>;
}

/****** Exposed namespace ******/
/**
 * Types and interfaces for @splitsoftware/splitio package for usage when integrating Javascript SDK on Typescript apps.
 * For the SDK package information
 * @see {@link https://www.npmjs.com/package/@splitsoftware/splitio}
 */
declare namespace SplitIO {
  /**
   * Settings interface for SDK instances created on the browser
   * @interface IBrowserSettings
   * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#configuration}
   */
  interface IBrowserSettings extends IClientSideSharedSettings, IStaticSettings {
    /**
     * SDK Core settings for the browser.
     * @property {Object} core
     */
    core: IClientSideSharedSettings['core'] & {
      /**
       * Traffic type associated with the customer identifier. @see {@link https://help.split.io/hc/en-us/articles/360019916311-Traffic-type}
       * If no provided as a setting it will be required on the client.track() calls.
       * @property {string} trafficType
       */
      trafficType?: string,
    },
    /**
     * The SDK mode. When using the default in memory storage or `LOCALSTORAGE` as storage, the only possible value is "standalone", which is the default.
     * For "localhost" mode, use "localhost" as authorizationKey.
     *
     * @property {'standalone'} mode
     * @default standalone
     */
    mode?: 'standalone',
    /**
     * Defines which kind of storage we can instantiate on the browser.
     * Possible storage types are 'MEMORY', which is the default, and 'LOCALSTORAGE'.
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
    },
    /**
     * SDK integration settings for the browser.
     * @property {Object} integrations
     */
    integrations?: BrowserIntegration[],
  }
  /**
   * Settings interface for SDK instances created on NodeJS.
   * If your storage is asynchronous (Redis for example) use SplitIO.INodeAsyncSettings instead.
   * @interface INodeSettings
   * @see {@link https://help.split.io/hc/en-us/articles/360020564931-Node-js-SDK#configuration}
   */
  interface INodeSettings extends IServerSideSharedSettings, IStaticSettings {
    /**
     * The SDK mode. When using the default 'MEMORY' storage, the only possible value is "standalone", which is the default.
     * For "localhost" mode, use "localhost" as authorizationKey.
     *
     * @property {'standalone'} mode
     * @default standalone
     */
    mode?: 'standalone',
    /**
     * Defines which kind of storage we can instantiate on NodeJS for 'standalone' mode.
     * The only possible storage type is 'MEMORY', which is the default.
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
    },
  }
  /**
   * Settings interface with async storage for SDK instances created on NodeJS.
   * If your storage is synchronous (by defaut we use memory, which is sync) use SplitIO.INodeSettings instead.
   * @interface INodeAsyncSettings
   * @see {@link https://help.split.io/hc/en-us/articles/360020564931-Node-js-SDK#configuration}
   */
  interface INodeAsyncSettings extends IServerSideSharedSettings, IStaticSettings {
    /**
     * The SDK mode. When using 'REDIS' storage type, the only possible value is "consumer", which is required.
     *
     * @see {@link https://help.split.io/hc/en-us/articles/360020564931-Node-js-SDK#state-sharing-redis-integration}
     *
     * @property {'consumer'} mode
     */
    mode: 'consumer'
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
        tls?: any,
      },
      /**
       * Optional prefix to prevent any kind of data collision between SDK versions.
       * @property {string} prefix
       * @default SPLITIO
       */
      prefix?: string
    },
  }
  /**
   * Representation of a manager instance with synchronous storage of the SDK.
   * @interface IManager
   */
  interface IManager extends NodeJSEventEmitter { }
  /**
   * Representation of a manager instance with asynchronous storage of the SDK.
   * @interface IAsyncManager
   */
  interface IAsyncManager extends NodeJSEventEmitter { }
  /**
   * This represents the interface for the Client instance with synchronous method calls and server-side API, where we don't have only one key.
   * @interface IClient
   */
  interface IClient extends IClientSS, NodeJSEventEmitter { }
  /**
   * This represents the interface for the SDK instance with synchronous method calls and server-side API, where we don't have only one key.
   * @interface ISDK
   */
  interface ISDK extends IBasicSDK<IClient, IManager> { }
  /**
   * This represents the interface for the Client instance with asynchronous method calls and server-side SDK, where we don't have only one key.
   * @interface IAsyncClient
   * @extends IBasicClient
   */
  interface IAsyncClient extends IAsyncClientSS, NodeJSEventEmitter { }
  /**
   * This represents the interface for the SDK instance with asynchronous method calls and server-side API, where we don't have only one key.
   * @interface IAsyncSDK
   */
  interface IAsyncSDK extends IBasicSDK<IAsyncClient, IAsyncManager> { }
  /**
   * This represents the interface for the Client instance with attributes binding, synchronous method calls, and client-side API, where each client has a key associated and optionally a traffic type.
   * @interface IBrowserClient
   */
  interface IBrowserClient extends IClientWithKey, NodeJSEventEmitter {
    /**
     * Tracks an event to be fed to the results product on Split Webconsole.
     * @function track
     * @param {string} trafficType - The traffic type of the entity related to this event.
     * @param {string} eventType - The event type corresponding to this event.
     * @param {number=} value - The value of this event.
     * @param {Properties=} properties - The properties of this event. Values can be string, number, boolean or null.
     * @returns {boolean} Whether the event was added to the queue successfully or not.
     */
    track(trafficType: string, eventType: string, value?: number, properties?: Properties): boolean,
    /**
     * Tracks an event to be fed to the results product on Split Webconsole.
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
   * This represents the interface for the SDK instance with synchronous method calls and client-side API, where client instances have a key associated and optionally a traffic type.
   * @interface IBrowserSDK
   */
  interface IBrowserSDK extends ISDKWithUserConsent<IBrowserClient, IManager> {
    /**
     * Returns the default client instance of the SDK, associated with the key and optional traffic type provided on settings.
     * @function client
     * @returns {IBrowserClient} The client instance.
     */
    client(): IBrowserClient,
    /**
     * Returns a shared client of the SDK, associated with the given key and optional traffic type.
     * @function client
     * @param {SplitKey} key The key for the new client instance.
     * @param {string=} trafficType The traffic type of the provided key.
     * @returns {IBrowserClient} The client instance.
     */
    client(key: SplitKey, trafficType?: string): IBrowserClient,
  }
}
