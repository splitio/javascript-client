import { get } from '../utils/lang';
import ClientWithInputValidationLayer from './inputValidation';
import { LOCALHOST_MODE } from '../utils/constants';
import {
  validateKey,
  validateTrafficType,
} from '../utils/inputValidation';

function BrowserClientFactory(context) {
  const settings = context.get(context.constants.SETTINGS);
  const maybeKey = get(settings, 'core.key', undefined);
  const maybeTT = get(settings, 'core.trafficType', undefined);

  if (settings.mode === LOCALHOST_MODE && maybeKey === undefined) {
    settings.core.key = 'localhost_key';
  } else {
    settings.core.key = validateKey(maybeKey, 'Client instantiation');
  }

  // Key is also binded to the .track method. Same thing happens with trafficType but only if present on configs. (not required)
  const trackBindings = [settings.core.key];
  if (maybeTT !== undefined) {
    const tt = validateTrafficType(maybeTT, 'Client instantiation');
    settings.core.trafficType = tt;
    trackBindings.push(tt);
  }

  const client = ClientWithInputValidationLayer(context, true, trackBindings.length > 1);
  client.isBrowserClient = true;

  // In the browser land, we can bind the key and the traffic type (if provided)
  client.getTreatment = client.getTreatment.bind(client, settings.core.key);
  client.getTreatmentWithConfig = client.getTreatmentWithConfig.bind(client, settings.core.key);
  client.getTreatments = client.getTreatments.bind(client, settings.core.key);
  client.getTreatmentsWithConfig = client.getTreatmentsWithConfig.bind(client, settings.core.key);
  client.track = client.track.bind(client, ...trackBindings);

  return client;
}

export default BrowserClientFactory;
