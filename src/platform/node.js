import EventEmitter from 'events';
import { getFetch } from '../platform/getFetch/node';
import { getEventSource } from '../platform/getEventSource/node';
import { getOptions } from '../platform/request/options/node';
import { NodeSignalListener } from '@splitsoftware/splitio-commons/src/listeners/node';

export const platform = {
  getOptions,
  getFetch,
  getEventSource,
  EventEmitter
};

export const SignalListener = NodeSignalListener;
