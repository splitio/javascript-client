export default class BaseMetricsAsyncCache {
  /**
   * Async storage caches will always count as empty from an SDK Producer point of view.
   */
  isEmpty() {
    return true;
  }
  /**
   * On async storages we will save metrics on Redis but nothing more. No clean ups or consumptions.
   */
  clear() {
    // noop.
  }
}
