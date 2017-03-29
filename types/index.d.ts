// Declaration file for Javascript and Node Split Software SDK v7.4.0
// Project: http://www.split.io/
// Definitions by: Nico Zelaya <https://github.com/NicoZelaya/>

/// <reference path="./splitio.d.ts" />

export = splitio;
/**
 * Split.io sdk factory function.
 * The settings parameter should be an object that complies with the SplitIO.ISplitBrowserSettings.
 * For more information read the corresponding article: @see {@link http://docs.split.io/docs/javascript-sdk-overview#section-advanced-configuration-of-the-sdk}
 */
declare function splitio(settings: SplitIO.ISplitBrowserSettings): SplitIO.ISplitSDK;
/**
 * Split.io sdk factory function.
 * The settings parameter should be an object that complies with the SplitIO.ISplitNodeSettings.
 * For more information read the corresponding article: @see {@link http://docs.split.io/docs/nodejs-sdk-overview#section-advanced-configuration-of-the-sdk}
 */
declare function splitio(settings: SplitIO.ISplitNodeSettings): SplitIO.ISplitSDK;
