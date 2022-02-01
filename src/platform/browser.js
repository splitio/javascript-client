// @TODO check 'events': it is a CommonJS module. Can have issues with ESM bundlers.
import EventEmitter from 'events';
import { getFetch } from '../platform/getFetch/browser';
import { getEventSource } from '../platform/getEventSource/browser';
import { BrowserSignalListener } from '@splitsoftware/splitio-commons/src/listeners/browser';

export const platform = {
  getFetch,
  getEventSource,
  EventEmitter
};

export const signalListener = BrowserSignalListener;
