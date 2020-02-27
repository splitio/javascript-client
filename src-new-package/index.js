import ClientFactory from './client';
import SplitCacheLocalStorage from './storage/SplitCache'
import KeyBuilderLocalStorage from './storage/KeysLocalStorage';
import SettingsFactory from './utils/settings';

// ClientFactory exported in order to call getTreatmentsWithConfig, we will pass in a `storage` object to this function
// SplitCacheLocalStorage, KeyBuilderLocalStorage, SettingsFactory exported for creating `splits` property of `storage` object
export default { ClientFactory, SplitCacheLocalStorage, KeyBuilderLocalStorage, SettingsFactory };
