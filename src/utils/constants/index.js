// SDK Modes
export const LOCALHOST_MODE = 'localhost';
export const STANDALONE_MODE = 'standalone';
export const PRODUCER_MODE = 'producer';
export const CONSUMER_MODE = 'consumer';
// Storage types
export const STORAGE_MEMORY = 'MEMORY';
export const STORAGE_REDIS = 'REDIS';
export const STORAGE_LOCALSTORAGE = 'LOCALSTORAGE';
// Special treatments
export const CONTROL = 'control';
export const CONTROL_WITH_CONFIG = {
  treatment: CONTROL,
  config: null
};
// Constants for unknown and not-applicable values
export const UNKNOWN = 'unknown';
export const NA = 'NA';
// Integration types
export const GA_TO_SPLIT = 'GA_TO_SPLIT';
export const SPLIT_TO_GA = 'SPLIT_TO_GA';
// Integration data types
export const SPLIT_IMPRESSION = 'IMPRESSION';
export const SPLIT_EVENT = 'EVENT';