// This file is just here for easier consumption of the validators.
import { validateApiKey } from './apiKey';
import { validateAttributes } from './attributes';
import { validateEvent } from './event';
import { validateEventValue } from './eventValue';
import { validateKey } from './key';
import { validateSplit } from './split';
import { validateSplits } from './splits';
import { validateTrafficType } from './trafficType';
import { validateIfOperational } from './isOperational';

export default {
  validateApiKey,
  validateAttributes,
  validateEvent,
  validateEventValue,
  validateKey,
  validateSplit,
  validateSplits,
  validateTrafficType,
  validateIfOperational
};
