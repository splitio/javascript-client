import getEventSource from '../../../services/getEventSource/node';

/**
 * Check if the Node environment has the necessary features to run in PUSH mode,
 * i.e., EventSource, base64 encoder and decoder.
 *
 * @return {boolean} if push is supported
 */
export function checkPushRequirements(logger) {
  const esReference = getEventSource();
  if (!esReference) {
    logger.warn('EventSource API is not available. Falling back to polling mode.');
    return false;
  }
  return true;
}