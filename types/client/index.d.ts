// Declaration file for JavaScript Split Software SDK
// Project: https://www.split.io/

import '@splitsoftware/splitio-commons';

export = JsSdk;

declare module JsSdk {
  /**
   * Split.io SDK factory function.
   * The settings parameter should be an object that complies with the SplitIO.IBrowserSettings.
   * For more information read the corresponding article: @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#configuration}
   */
  export function SplitFactory(settings: SplitIO.IBrowserSettings): SplitIO.IBrowserSDK;
}
