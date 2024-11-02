import { splitsParserFromFileFactory } from './splitsParserFromFile';
import { syncManagerOfflineFactory } from '@splitsoftware/splitio-commons/src/sync/offline/syncManagerOffline';

// Singleton instance of the factory function for offline SyncManager from YAML file
// It uses NodeJS APIs.
export const localhostFromFileFactory = syncManagerOfflineFactory(splitsParserFromFileFactory);
