import PushManagerFactory from './pushmanager';

export default function BrowserSyncManagerFactory(settings) {

  let pushManager = undefined;
  return {
    startFullProducer(producer) {
      if (settings.streamingEnabled)
        pushManager = PushManagerFactory(settings, producer, true);
      if (!pushManager)
        producer.start();
      else {
        const splitKey = settings.core.key;
        pushManager.addProducerWithMySegmentsUpdater(splitKey, producer);
      }
    },
    stopFullProducer(producer) {
      if (pushManager)
        pushManager.stopFullProducer(producer);
      else
        producer.stop();
    },
    startPartialProducer(producer, sharedSettings) {
      if (pushManager) {
        const splitKey = sharedSettings.core.key;
        pushManager.addProducerWithMySegmentsUpdater(splitKey, producer);
      } else
        producer.start();
    },
    stopPartialProducer(producer, sharedSettings) {
      if (pushManager) {
        const splitKey = sharedSettings.core.key;
        pushManager.removeProducerWithMySegmentsUpdater(splitKey, producer);
      } else
        producer.stop();
    },
  };
}