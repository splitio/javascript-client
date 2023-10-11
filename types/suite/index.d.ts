// Declaration file for JavaScript Split Software SDK
// Project: http://www.split.io/

/// <reference path="../splitio.d.ts" />
export = JsSdk;

declare module JsSdk {
  /**
   * Split.io Suite factory function.
   * The settings parameter should be an object that complies with the SplitIO.IBrowserSuiteSettings.
   * For more information read the corresponding article: @see {@link https://help.split.io/hc/en-us/articles/360030898431-Browser-RUM-agent#sdk-integration}
   */
  export function SplitSuite(settings: SplitIO.IBrowserSuiteSettings): SplitIO.IBrowserSuiteSDK;
}
