import { EventEmitter } from '@splitsoftware/splitio-commons/src/utils/EventEmitter';
import { getEventSource } from '@splitsoftware/splitio-commons/src/platform/getEventSource/browser';
import { BrowserSignalListener } from '@splitsoftware/splitio-commons/src/listeners/browser';
import { now } from '@splitsoftware/splitio-commons/src/utils/timeTracker/now/browser';
import unfetch from 'unfetch';

// @TODO: Breaking change (drop support for old browsers without native fetch): replace with '@splitsoftware/splitio-commons/src/platform/getFetch/browser' and remove `unfetch` dependency
export function getFetch() {
  return typeof fetch === 'function' ? fetch : unfetch;
}


export const platform = {
  getFetch,
  getEventSource,
  EventEmitter,
  now,
  SignalListener: BrowserSignalListener,
};
