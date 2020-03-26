import PushManagerFactory from './PushManager';
import FullProducerFactory from '../producer';
import PartialProducerFactory from '../producer/browser/Partial';
import { matching } from '../utils/key/factory';
import { forOwn } from '../utils/lang';
import { hashUserKey } from '../utils/jwt/hashUserKey';
import { SETTINGS, STORAGE } from '../utils/context/constants';

/**
 * Factory of sync manager for browser
 *
 * @param context main client context
 */
export default function BrowserSyncManagerFactory() {

  let pushManager;
  let mainProducer; // reference to browser full producer (main client producer)

  // `clients` is a mapping of user keys to their corresponding hashes, partial producers and segments storages.
  const clients = {
    // mapping of user keys to hashes
    userKeys: {},
    // inverse mapping of hashes to user keys
    userKeyHashes: {},
    // mapping of user keys to their partial producers (`producer`) and segments storages (`mySegmentsStorage`),
    clients: {},
  };

  // adds an entry to `clients` maps
  function addClient(context, isSharedClient) {
    const settings = context.get(SETTINGS);
    const userKey = matching(settings.core.key);
    const producer = isSharedClient ? PartialProducerFactory(context) : FullProducerFactory(context);
    const mySegmentsStorage = context.get(STORAGE).segments;

    clients.clients[userKey] = { producer, mySegmentsStorage };
    const hash = hashUserKey(userKey);
    clients.userKeys[userKey] = hash;
    clients.userKeyHashes[hash] = userKey;

    return producer;
  }

  // removes an entry from `clients` maps, and returns its producer
  function removeClient(context) {
    const settings = context.get(SETTINGS);
    const userKey = matching(settings.core.key);

    const client = clients.clients[userKey];
    if (client) { // check in case `client.destroy()` has been invoked more than once for the same client
      delete clients.clients[userKey];
      delete clients.userKeyHashes[clients.userKeys[userKey]];
      delete clients.userKeys[userKey];
      return client.producer;
    }
  }

  function startPolling() {
    forOwn(clients.clients, function (entry) {
      if (!entry.producer.isRunning())
        entry.producer.start();
    });
  }

  function stopPollingAndSyncAll() {
    // if polling, stop
    forOwn(clients.clients, function (entry) {
      if (entry.producer.isRunning())
        entry.producer.stop();
    });
    syncAll();
  }

  function syncAll() {
    // fetch splits and segments
    mainProducer.callSplitsUpdater();
    // @TODO review precence of segments to run mySegmentUpdaters
    forOwn(clients.clients, function (entry) {
      entry.producer.callMySegmentsUpdater();
    });
  }

  return {

    startSync(context, isSharedClient) {

      const producer = addClient(context, isSharedClient);

      // if main client and streamingEnabled, create PushManager
      if (!isSharedClient) {
        mainProducer = producer;
        const settings = context.get(SETTINGS);
        if (settings.streamingEnabled) {
          pushManager = PushManagerFactory({
            onPushConnect: stopPollingAndSyncAll,
            onPushDisconnect: startPolling,
          }, context, mainProducer, clients);
        }
      }

      // start syncing
      if (pushManager) {
        if (!isSharedClient) syncAll(); // initial syncAll (only when main client is created)
        pushManager.connectPush(); // reconnects in case of a new shared client
      } else {
        producer.start();
      }
    },

    stopSync(context, isSharedClient) {

      const producer = removeClient(context);

      // stop push if stoping main client
      if (!isSharedClient && pushManager)
        pushManager.stopPush();

      if (producer && producer.isRunning())
        producer.stop();
      // We don't reconnect pushmanager when removing a client,
      // since it is more costly than continue listening the channel
    },
  };
}