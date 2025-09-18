// Declaration file for JavaScript Split Software SDK
// Project: https://www.split.io/

import '@splitsoftware/splitio-commons';

export = JsSdk;

declare module JsSdk {
  /**
   * Split.io SDK factory function.
   * The settings parameter should be an object that complies with the SplitIO.INodeAsyncSettings.
   * For more information read the corresponding article: @see {@link https://developer.harness.io/docs/feature-management-experimentation/sdks-and-infrastructure/server-side-sdks/nodejs-sdk/#configuration}
   */
  export function SplitFactory(settings: SplitIO.INodeAsyncSettings): SplitIO.IAsyncSDK;
  /**
   * Split.io SDK factory function.
   * The settings parameter should be an object that complies with the SplitIO.INodeSettings.
   * For more information read the corresponding article: @see {@link https://developer.harness.io/docs/feature-management-experimentation/sdks-and-infrastructure/server-side-sdks/nodejs-sdk/#configuration}
   */
  export function SplitFactory(settings: SplitIO.INodeSettings): SplitIO.ISDK;
}
