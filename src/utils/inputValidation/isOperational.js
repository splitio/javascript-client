import logFactory from '../logger';
const log = logFactory('', {
  displayAllErrors: true
});

export function validateIfOperational(context) {
  if (!context.get(context.constants.DESTROYED, true)) return true;

  log.error('Client has already been destroyed - no calls possible.');
  return false;
}
