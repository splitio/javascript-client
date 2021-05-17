/**
Copyright 2016 Split Software

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
**/

import osFunction from 'os';
import ipFunction from 'ip';

import { UNKNOWN, NA } from '../../constants';

export default function generateRuntimeSettings(isIPAddressesEnabled, isConsumerMode) {
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