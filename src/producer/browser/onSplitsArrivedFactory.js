import logFactory from '../../utils/logger';
const log = logFactory('splitio-producer:mySegmentsHandler');

export default function onSplitsArrivedCtx(segmentsUpdaterTask, context) {
  const splitsStorage = context.get(context.constants.STORAGE).splits;
  const { segments: segmentsEventEmitter } = context.get(context.constants.READINESS);

  // @TODO refactor/simplify code. e.g., rename functions, remove `onceSplitsArrived` from listeners once client is ready
  return {
    onceSplitsArrived() {
      const splitsHaveSegments = splitsStorage.usesSegments();

      const isReady = context.get(context.constants.READY, true);
      if (!isReady && !splitsHaveSegments) segmentsEventEmitter.emit(segmentsEventEmitter.SDK_SEGMENTS_ARRIVED);
    },
    onSplitsArrived() {
      const splitsHaveSegments = splitsStorage.usesSegments();

      if (splitsHaveSegments !== segmentsUpdaterTask.isRunning()) {
        log.info(`Turning segments data polling ${splitsHaveSegments ? 'ON' : 'OFF'}.`);

        if (splitsHaveSegments) {
          segmentsUpdaterTask.start();
        } else {
          segmentsUpdaterTask.stop();
        }
      }
    }
  };
}
