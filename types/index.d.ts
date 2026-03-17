// Declaration file for JavaScript and Node.js Split Software SDK v8.1.0
// Project: https://www.split.io/
// Definitions by: Nico Zelaya <https://github.com/NicoZelaya/>

/// <reference path="./splitio.d.ts" />

export = JsSdk;

declare namespace JsSdk {
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
  /**
   * Split.io SDK factory function.
   * The settings parameter should be an object that complies with the SplitIO.IBrowserSettings.
   * For more information read the corresponding article: @see {@link https://developer.harness.io/docs/feature-management-experimentation/sdks-and-infrastructure/client-side-sdks/javascript-sdk/#configuration}
   */
  export function SplitFactory(settings: SplitIO.IBrowserSettings): SplitIO.IBrowserSDK;
}
