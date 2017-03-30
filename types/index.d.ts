// Declaration file for Javascript and Node Split Software SDK v7.4.0
// Project: http://www.split.io/
// Definitions by: Nico Zelaya <https://github.com/NicoZelaya/>

/// <reference path="./splitio.d.ts" />

export = SplitFacade;
/**
 * Split.io sdk facade function.
 * The settings parameter should be an object that complies with the SplitIO.IBrowserSettings.
 * For more information read the corresponding article: @see {@link http://docs.split.io/docs/javascript-sdk-overview#section-advanced-configuration-of-the-sdk}
 */
declare function SplitFacade(settings: SplitIO.IBrowserSettings): SplitIO.ISDK;
/**
 * Split.io sdk facade function.
 * The settings parameter should be an object that complies with the SplitIO.INodeSettings.
 * For more information read the corresponding article: @see {@link http://docs.split.io/docs/nodejs-sdk-overview#section-advanced-configuration-of-the-sdk}
 */
declare function SplitFacade(settings: SplitIO.INodeSettings): SplitIO.ISDK;
