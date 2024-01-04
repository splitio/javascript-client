import EventEmitter from 'events';
import { getFetch } from '../platform/getFetch/node';
import { getEventSource } from '../platform/getEventSource/node';
import { NodeSignalListener } from '@splitsoftware/splitio-commons/src/listeners/node';
import { now } from '@splitsoftware/splitio-commons/src/utils/timeTracker/now/node';

export const platform = {
  getFetch,
  getEventSource,
  EventEmitter,
  now
};

export const SignalListener = NodeSignalListener;
