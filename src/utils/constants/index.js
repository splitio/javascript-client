// SDK Modes
export const LOCALHOST_MODE = 'localhost';
export const STANDALONE_MODE = 'standalone';
export const PRODUCER_MODE = 'producer';
export const CONSUMER_MODE = 'consumer';
// Storage types
export const STORAGE_MEMORY = 'MEMORY';
export const STORAGE_REDIS = 'REDIS';
export const STORAGE_LOCALSTORAGE = 'LOCALSTORAGE';
export const STORAGE_CLOUDFLARE_KV = 'CLOUDFLARE_KV';
// Special treatments
export const CONTROL = 'control';
export const CONTROL_WITH_CONFIG = {
  treatment: CONTROL,
  config: null
};
// Constants for unknown and not-applicable values
export const UNKNOWN = 'unknown';
export const NA = 'NA';
