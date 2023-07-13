// Declaration file for JavaScript Split Software SDK
// Project: http://www.split.io/

/// <reference path="../splitio.d.ts" />
export = JsSdk;

declare module JsSdk {
  /**
   * @TODO
   */
  export function SplitSuite(settings: SplitIO.IBrowserSuiteSettings): SplitIO.IBrowserSuiteSDK;
}
