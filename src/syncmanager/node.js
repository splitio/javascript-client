import PushManagerFactory from './pushmanager';

export default function NodeSyncManagerFactory(settings) {

  let pushManager = undefined;

  return {
    startFullProducer(producer) {
      if (settings.streamingEnabled)
        pushManager = PushManagerFactory(settings, producer);
      if (!pushManager)
        producer.start();
    },
    stopFullProducer(producer) {
      if (pushManager)
        pushManager.stopFullProducer(producer);
      else
        producer.stop();
    },
  };
}