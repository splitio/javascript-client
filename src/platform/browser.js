import { EventEmitter } from './EventEmitter';
import { getFetch } from '../platform/getFetch/browser';
import { getEventSource } from '../platform/getEventSource/browser';
import { BrowserSignalListener } from '@splitsoftware/splitio-commons/src/listeners/browser';

export const platform = {
  getFetch,
  getEventSource,
  EventEmitter
};

export const SignalListener = BrowserSignalListener;
