export default function NodeSyncManagerFactory(context) {
  context;
  return {
    startFullProducer(producer) {
      producer.start();
    },
    stopFullProducer(producer) {
      producer.stop();
    },
  };
}