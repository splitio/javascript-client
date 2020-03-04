export default function BrowserSyncManagerFactory(context) {
  context;
  return {
    startFullProducer(producer) {
      producer.start();
    },
    stopFullProducer(producer) {
      producer.stop();
    },
    startPartialProducer(producer, sharedContext) {
      sharedContext;
      producer.start();
    },
    stopPartialProducer(producer) {
      producer.stop();
    },
  };
}