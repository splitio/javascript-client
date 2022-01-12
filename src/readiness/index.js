import EventEmitter from 'events';

const SPLITS_READY = 2;
const SEGMENTS_READY = 4;
const SDK_FIRE_READY = SPLITS_READY | SEGMENTS_READY; // 2 + 4 = 6
const SDK_NOTIFY_UPDATE_SINCE_NOW = 8;
const SDK_FIRE_UPDATE = SDK_FIRE_READY | SDK_NOTIFY_UPDATE_SINCE_NOW; // 6 + 8 = 14

const Events = {
  SDK_READY_TIMED_OUT: 'init::timeout',
  SDK_READY: 'init::ready',
  SDK_READY_FROM_CACHE: 'init::cache-ready',
  SDK_SPLITS_ARRIVED: 'state::splits-arrived',
  SDK_SEGMENTS_ARRIVED: 'state::segments-arrived',
  SDK_SPLITS_CACHE_LOADED: 'state::splits-cache-loaded',
  SDK_UPDATE: 'state::update',
  READINESS_GATE_CHECK_STATE: 'state::check'
};

/**
 * Machine state to handle the ready / update event propagation.
 */
function GateContext() {
  // Splits are shared through all instances of the same SDK.
  let splitsStatus = 0;

  const splits = new EventEmitter();
  splits.SDK_SPLITS_CACHE_LOADED = Events.SDK_SPLITS_CACHE_LOADED;
  splits.SDK_SPLITS_ARRIVED = Events.SDK_SPLITS_ARRIVED;

  // references counter: how many
  let refCount = 0;

  function ReadinessGateFactory(splits, segments) {
    const gate = new EventEmitter();
    let segmentsStatus = 0;
    let status = 0;

    gate.on(Events.READINESS_GATE_CHECK_STATE, () => {
      if (status !== SDK_FIRE_UPDATE && splitsStatus + segmentsStatus === SDK_FIRE_READY) {
        status = SDK_FIRE_UPDATE;
        gate.emit(Events.SDK_READY);
      } else if (status === SDK_FIRE_UPDATE) {
        gate.emit(Events.SDK_UPDATE);
      }
    });

    splits.on(Events.SDK_SPLITS_ARRIVED, (isSplitKill) => {
      // `isSplitKill` condition avoids an edge-case of wrongly emitting SDK_READY if:
      // - `/mySegments` fetch and SPLIT_KILL occurs before `/splitChanges` fetch, and
      // - storage has cached splits (for which case `splitsStorage.killLocally` can return true)
      if (!isSplitKill) splitsStatus = SPLITS_READY;
      gate.emit(Events.READINESS_GATE_CHECK_STATE);
    });

    splits.once(Events.SDK_SPLITS_CACHE_LOADED, () => {
      gate.emit(Events.SDK_READY_FROM_CACHE);
    });

    segments.on(Events.SDK_SEGMENTS_ARRIVED, () => {
      segmentsStatus = SEGMENTS_READY;
      gate.emit(Events.READINESS_GATE_CHECK_STATE);
    });

    return gate;
  }

  /**
   * SDK Readiness Gate Factory
   *
   * The ready state in the browser relay on sharing the splits ready flag across
   * all the gates, and have an extra flag for the segments which is per gate
   * instance.
   */
  function SDKReadinessGateFactory(timeout = 0) {
    let readinessTimeoutId = 0;
    const segments = new EventEmitter();
    segments.SDK_SEGMENTS_ARRIVED = Events.SDK_SEGMENTS_ARRIVED;

    const gate = ReadinessGateFactory(splits, segments);

    if (timeout > 0) {
      // Add the timeout.
      readinessTimeoutId = setTimeout(() => {
        gate.emit(Events.SDK_READY_TIMED_OUT, 'Split SDK emitted SDK_READY_TIMED_OUT event.');
      }, timeout);
      // Clear it if the SDK get's ready.
      gate.once(Events.SDK_READY, () => clearTimeout(readinessTimeoutId));
    }

    gate.SDK_READY = Events.SDK_READY;
    gate.SDK_READY_FROM_CACHE = Events.SDK_READY_FROM_CACHE;
    gate.SDK_UPDATE = Events.SDK_UPDATE;
    gate.SDK_READY_TIMED_OUT = Events.SDK_READY_TIMED_OUT;

    // New Gate has been created, so increase the counter
    refCount++;

    return {
      // Emitters
      splits,
      segments,
      gate,
      // Cleanup listeners
      destroy() {
        segments.removeAllListeners();
        gate.removeAllListeners();
        clearTimeout(readinessTimeoutId);

        if (refCount > 0) refCount--;
        if (refCount === 0) splits.removeAllListeners();
      }
    };
  }

  return SDKReadinessGateFactory;
}

export default GateContext;
