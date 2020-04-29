import logFactory from '../../utils/logger';
const log = logFactory('splitio-producer:mySegmentsHandler');

export default function onSplitsArrivedCtx(segmentsUpdaterTask, context) {
  const splitsStorage = context.get(context.constants.STORAGE).splits;
  const { segments: segmentsEventEmitter } = context.get(context.constants.READINESS);

  return function onSplitsArrived() {
    const splitsHaveSegments = splitsStorage.usesSegments();

    if (splitsHaveSegments !== segmentsUpdaterTask.isRunning()) {
      log.info(`Turning segments data polling ${splitsHaveSegments ? 'ON' : 'OFF'}.`);

      if (splitsHaveSegments) {
        segmentsUpdaterTask.start();
      } else {
        const isReady = context.get(context.constants.READY, true);

        if (!isReady) segmentsEventEmitter.emit(segmentsEventEmitter.SDK_SEGMENTS_ARRIVED);
        segmentsUpdaterTask.stop();
      }
    }
  };
}
