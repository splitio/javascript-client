import PushManagerFactory from './pushmanager';

export default function NodeSyncManagerFactory(context) {
  const settings = context.get(context.constants.SETTINGS);

  let pushManager = undefined;
  if (settings.streamingEnabled)
    pushManager = PushManagerFactory(context);

  return {
    startFullProducer(producer) {
      if (pushManager)
        pushManager.startFullProducer(producer);
      else
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