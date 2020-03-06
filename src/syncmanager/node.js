import PushManagerFactory from './pushmanager';

export default function NodeSyncManagerFactory(context) {
  const settings = context.get(context.constants.SETTINGS);

  let pushManager = undefined;

  return {
    startFullProducer(producer) {
      if (settings.streamingEnabled)
        pushManager = PushManagerFactory(context, producer);
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