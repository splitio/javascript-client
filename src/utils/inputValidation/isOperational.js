import logFactory from '../logger';
const log = logFactory('', { displayAllErrors: true });

export function validateIfDestroyed(context) {
  if (!context.get(context.constants.DESTROYED, true)) return true;

  log.error('Client has already been destroyed - no calls possible.');
  return false;
}

export function validateIfReady(context, method) {
  if (context.get(context.constants.READY, true) || context.get(context.constants.READY_FROM_CACHE, true)) return true;

  log.warn(`${method}: the SDK is not ready, results may be incorrect. Make sure to wait for SDK readiness before using this method.`);
  return false;
}
