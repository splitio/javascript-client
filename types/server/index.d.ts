// Declaration file for JavaScript Split Software SDK
// Project: http://www.split.io/

import '@splitsoftware/splitio-commons';

export = JsSdk;

declare module JsSdk {
  /**
   * Split.io SDK factory function.
   * The settings parameter should be an object that complies with the SplitIO.INodeAsyncSettings.
   * For more information read the corresponding article: @see {@link https://help.split.io/hc/en-us/articles/360020564931-Node-js-SDK#configuration}
   */
  export function SplitFactory(settings: SplitIO.INodeAsyncSettings): SplitIO.INodeAsyncSDK;
  /**
   * Split.io SDK factory function.
   * The settings parameter should be an object that complies with the SplitIO.INodeSettings.
   * For more information read the corresponding article: @see {@link https://help.split.io/hc/en-us/articles/360020564931-Node-js-SDK#configuration}
   */
  export function SplitFactory(settings: SplitIO.INodeSettings): SplitIO.INodeSDK;
}
