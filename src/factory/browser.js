import { splitApiFactory } from '@splitsoftware/splitio-commons/src/services/splitApi';
import { syncManagerOnlineFactory } from '@splitsoftware/splitio-commons/src/sync/syncManagerOnline';
import { pushManagerFactory } from '@splitsoftware/splitio-commons/src/sync/streaming/pushManager';
import { pollingManagerCSFactory } from '@splitsoftware/splitio-commons/src/sync/polling/pollingManagerCS';
import { InLocalStorage } from '@splitsoftware/splitio-commons/src/storages/inLocalStorage';
import { InMemoryStorageCSFactory } from '@splitsoftware/splitio-commons/src/storages/inMemory/InMemoryStorageCS';
import { sdkManagerFactory } from '@splitsoftware/splitio-commons/src/sdkManager';
import { sdkClientMethodCSFactory } from '@splitsoftware/splitio-commons/src/sdkClient/sdkClientMethodCSWithTT';
import { impressionObserverCSFactory } from '@splitsoftware/splitio-commons/src/trackers/impressionObserver/impressionObserverCS';
import { integrationsManagerFactory } from '@splitsoftware/splitio-commons/src/integrations/browser';
import { __InLocalStorageMockFactory } from '@splitsoftware/splitio-commons/src/utils/settingsValidation/storage/storageCS';
import { sdkFactory } from '@splitsoftware/splitio-commons/src/sdkFactory';

import { settingsFactory } from '../settings/browser';
import { shouldAddPt } from './commons';
import { platform, signalListener } from '../platform';

const syncManagerOnlineCSFactory = syncManagerOnlineFactory(pollingManagerCSFactory, pushManagerFactory);

/**
 *
 * @param {import("@splitsoftware/splitio-commons/types/types").ISettings} settings
 */
function getModules(settings) {

  return {
    settings,

    platform,

    storageFactory: settings.storage.type === 'LOCALSTORAGE' ?
      InLocalStorage({
        prefix: settings.storage.prefix,
      })
      : settings.storage.__originalType === 'LOCALSTORAGE' ?
        __InLocalStorageMockFactory
        : InMemoryStorageCSFactory,

    splitApiFactory: settings.mode === 'localhost' ? undefined : splitApiFactory,
    syncManagerFactory: settings.mode === 'localhost' ? settings.sync.localhostMode : syncManagerOnlineCSFactory,

    sdkManagerFactory,
    sdkClientMethodFactory: sdkClientMethodCSFactory,
    SignalListener: settings.mode === 'localhost' ? undefined : signalListener,
    impressionListener: settings.impressionListener,

    integrationsManagerFactory: settings.integrations && settings.integrations.length > 0 ? integrationsManagerFactory.bind(null, settings.integrations) : undefined,

    // @TODO consider not including in debug mode?
    impressionsObserverFactory: shouldAddPt(settings) ? impressionObserverCSFactory : undefined,
  };
}

export function SplitFactory(config) {
  const settings = settingsFactory(config);
  const modules = getModules(settings);
  return sdkFactory(modules);
}
