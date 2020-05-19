import logFactory from '../../utils/logger';
const log = logFactory('splitio-producer:mySegmentsHandler');

export default function onSplitsArrivedCtx(segmentsUpdaterTask, context) {
  const splitsStorage = context.get(context.constants.STORAGE).splits;

  return function onSplitsArrived() {
    const splitsHaveSegments = splitsStorage.usesSegments();

    if (splitsHaveSegments !== segmentsUpdaterTask.isRunning()) {
      log.info(`Turning segments data polling ${splitsHaveSegments ? 'ON' : 'OFF'}.`);

      if (splitsHaveSegments) {
        segmentsUpdaterTask.start();
      } else {
        segmentsUpdaterTask.stop();
      }
    }
  };
}
