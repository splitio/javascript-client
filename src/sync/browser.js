import PushManagerFactory from './PushManager';
import FullProducerFactory from '../producer';
import PartialProducerFactory from '../producer/browser/Partial';
import { matching } from '../utils/key/factory';
import { forOwn } from '../utils/lang';
import { hashUserKey } from '../utils/jwt/hashUserKey';
import { SETTINGS, STORAGE } from '../utils/context/constants';

/**
 * Factory of sync manager
 * It keeps a single partialProducer per userKey instead of shared client, to avoid duplicated `/mySegments` requests
 *
 * @param context main client context
 */
export default function BrowserSyncManagerFactory() {

  let pushManager = undefined;
  let mainProducer = undefined; // reference to browser full producer (main client producer)

  // `clients` is a mapping of user keys to their corresponding hashes, partial producers and segments storages.
  const clients = {
    // mapping of user keys to hashes
    userKeys: {},
    // inverse mapping of hashes to user keys
    userKeyHashes: {},
    // mapping of user keys to their partial producers (`producer`) and segments storages (`mySegmentsStorage`),
    clients: {},
  };

  // adds an entry to `clients` maps. If the client is new, it creates and returns the client producer
  function addClient(userKey, clientContext, isSharedClient) {
    if (!clients.clients[userKey]) {
      const producer = isSharedClient ? PartialProducerFactory(clientContext) : FullProducerFactory(clientContext);
      const mySegmentsStorage = clientContext.get(STORAGE).segments;
      clients.clients[userKey] = { producer, mySegmentsStorage, count: 1 };

      const hash = hashUserKey(userKey);
      clients.userKeys[userKey] = hash;
      clients.userKeyHashes[hash] = userKey;

      return producer;
    } else {
      // if previously created, count it
      clients.clients[userKey].count++;
    }
  }

  // removes an entry from `clients` maps. If it is last reference of the given `userKey`, it returns the client producer
  function removeClient(userKey) {
    const client = clients.clients[userKey];
    if (client) {
      client.count--;
      if (client.count === 0) {
        delete clients.clients[userKey];
        delete clients.userKeyHashes[clients.userKeys[userKey]];
        delete clients.userKeys[userKey];
        return client.producer;
      }
    }
  }

  function startPolling() {
    forOwn(clients.clients, function (entry) {
      if (!entry.producer.isRunning())
        entry.producer.start();
    });
  }

  function stopPolling() {
    // if polling, stop
    forOwn(clients.clients, function (entry) {
      if (entry.producer.isRunning())
        entry.producer.stop();
    });
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
      const settings = context.get(SETTINGS);
      const userKey = matching(settings.core.key);
      const producer = addClient(userKey, context, isSharedClient);

      if (producer) {
        // if main client and streamingEnabled, create PushManager
        if (!isSharedClient) {
          mainProducer = producer;
          if (settings.streamingEnabled) {
            pushManager = PushManagerFactory({
              startPolling,
              stopPolling,
              syncAll,
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
      }
    },

    stopSync(context, isSharedClient) {
      const settings = context.get(SETTINGS);
      const userKey = matching(settings.core.key);
      const producerToStop = isSharedClient ? removeClient(userKey) : mainProducer;

      // stop push if stoping main client
      if (!isSharedClient && pushManager)
        pushManager.stopPush();

      if (producerToStop && producerToStop.isRunning())
        producerToStop.stop();
      // We don't reconnect pushmanager when removing a client,
      // since it is more costly than continue listening the channel
    },
  };
}