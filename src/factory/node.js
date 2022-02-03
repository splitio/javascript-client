import { splitApiFactory } from '@splitsoftware/splitio-commons/src/services/splitApi';
import { syncManagerOnlineFactory } from '@splitsoftware/splitio-commons/src/sync/syncManagerOnline';
import { pushManagerFactory } from '@splitsoftware/splitio-commons/src/sync/streaming/pushManager';
import { pollingManagerSSFactory } from '@splitsoftware/splitio-commons/src/sync/polling/pollingManagerSS';
import { InRedisStorage } from '@splitsoftware/splitio-commons/src/storages/inRedis';
import { InMemoryStorageFactory } from '@splitsoftware/splitio-commons/src/storages/inMemory/InMemoryStorage';
import { sdkManagerFactory } from '@splitsoftware/splitio-commons/src/sdkManager';
import { sdkClientMethodFactory } from '@splitsoftware/splitio-commons/src/sdkClient/sdkClientMethod';
import { impressionObserverSSFactory } from '@splitsoftware/splitio-commons/src/trackers/impressionObserver/impressionObserverSS';
import { sdkFactory } from '@splitsoftware/splitio-commons/src/sdkFactory';

import { settingsFactory } from '../settings/node';
import { shouldAddPt } from './commons';
import { platform, signalListener } from '../platform';

const syncManagerOnlineSSFactory = syncManagerOnlineFactory(pollingManagerSSFactory, pushManagerFactory);

/**
 *
 * @param {import("@splitsoftware/splitio-commons/types/types").ISettings} settings
 */
function getModules(settings) {
  return {
    settings,

    platform,

    storageFactory: settings.storage.type === 'REDIS' ?
      InRedisStorage({
        prefix: settings.storage.prefix,
        options: settings.storage.options
      }) :
      InMemoryStorageFactory,

    splitApiFactory: settings.mode === 'localhost' ? undefined : splitApiFactory,
    syncManagerFactory: settings.storage.type === 'REDIS' ? undefined : settings.mode === 'localhost' ? settings.sync.localhostMode : syncManagerOnlineSSFactory,

    sdkManagerFactory,
    sdkClientMethodFactory: sdkClientMethodFactory,
    SignalListener: settings.mode === 'localhost' ? undefined : signalListener,
    impressionListener: settings.impressionListener,

    impressionsObserverFactory: shouldAddPt(settings) ? impressionObserverSSFactory : undefined,
  };
}

export function SplitFactory(config) {
  const settings = settingsFactory(config);
  const modules = getModules(settings);
  return sdkFactory(modules);
}
