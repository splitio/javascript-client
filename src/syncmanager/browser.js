import PushManagerFactory from './pushmanager';
import FullProducerFactory from '../producer';
import PartialProducerFactory from '../producer/browser/Partial';
import { matching } from '../utils/key/factory';

/**
 * Factory of sync manager
 * It was designed considering a plugable PushManager:
 * if the push manager is available, the SyncManager passes down the responsability of handling producer
 *
 * @param context main client context
 */
export default function BrowserSyncManagerFactory(context) {

  const settings = context.get(context.constants.SETTINGS);
  let pushManager = undefined;
  let producer = undefined;
  const partialProducers = {};

  return {

    startMainClient(context) {
      // create fullProducer and save reference as a `partialProducer`
      // in order to keep a single mySegmentUpdater for the same user key.
      producer = FullProducerFactory(context);

      const userKey = matching(settings.core.key);
      partialProducers[userKey] = {
        producer,
        count: 1,
      };

      // start syncing
      if (settings.streamingEnabled)
        pushManager = PushManagerFactory(settings, producer, userKey);
      if (!pushManager)
        producer.start();
    },

    stopMainClient() {
      // stop syncing
      if (pushManager)
        pushManager.stopFullProducer(producer);
      else
        producer.stop();
    },

    startSharedClient(sharedContext, settings) {

      const userKey = matching(settings.core.key);
      if (!partialProducers[userKey] || partialProducers[userKey].count === 0) {
        // if not previously created or already stoped (count === 0),
        // create new partialProducer and save reference for `stopSharedClient`
        const partialProducer = PartialProducerFactory(sharedContext);
        partialProducers[userKey] = {
          partialProducer,
          count: 1,
        };

        // start syncing
        if (pushManager)
          pushManager.addPartialProducer(userKey, partialProducer);
        else
          partialProducer.start();

      } else {
        // if previously created, count it
        partialProducers[userKey].count++;
      }
    },

    stopSharedClient(settings) {

      const userKey = matching(settings.core.key);

      const partialProducer = partialProducers[userKey];
      if (partialProducer) {
        partialProducer.count--;
        const { producer, count } = partialProducer;

        // stop syncing
        if (count === 0) {
          if (pushManager)
            pushManager.removePartialProducer(userKey, producer);
          else
            producer.stop();
        }
      }
    },
  };
}