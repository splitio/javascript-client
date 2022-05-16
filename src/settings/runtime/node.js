import osFunction from 'os';
import ipFunction from '../../utils/ip';

import { UNKNOWN, NA, CONSUMER_MODE } from '@splitsoftware/splitio-commons/src/utils/constants';

export function validateRuntime(settings) {
  const isIPAddressesEnabled = settings.core.IPAddressesEnabled === true;
  const isConsumerMode = settings.mode === CONSUMER_MODE;

  // If the values are not available, default to false (for standalone) or "unknown" (for consumer mode, to be used on Redis keys)
  let ip = ipFunction.address() || (isConsumerMode ? UNKNOWN : false);
  let hostname = osFunction.hostname() || (isConsumerMode ? UNKNOWN : false);

  if (!isIPAddressesEnabled) { // If IPAddresses setting is not enabled, set as false (for standalone) or "NA" (for consumer mode, to  be used on Redis keys)
    ip = hostname = isConsumerMode ? NA : false;
  }

  return {
    ip, hostname
  };
}
