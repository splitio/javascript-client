import { splitsParserFromFileFactory } from './splitsParserFromFile';
import { syncManagerOfflineFactory } from '@splitsoftware/splitio-commons/src/sync/offline/syncManagerOffline';

// Singleton instance of the factory function for offline SyncManager from YAML file (a.k.a. localhostFromFile)
// It uses NodeJS APIs.
const localhostFromFile = syncManagerOfflineFactory(splitsParserFromFileFactory);
localhostFromFile.type = 'LocalhostFromFile';

export function LocalhostFromFile() {
  return localhostFromFile;
}
