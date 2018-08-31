import get from 'lodash/get';
import ClientFactory from './client';
import { LOCALHOST_MODE } from '../utils/constants';

function FixKey(context) {
  const settings = context.get(context.constants.SETTINGS);
  let key = get(settings, 'core.key', undefined);
  let tt = get(settings, 'core.trafficType', undefined);

  if (settings.mode === LOCALHOST_MODE && key === undefined) {
    settings.core.key = 'localhost_key';
  }

  const client = ClientFactory(context);
  client.isBrowserClient = true;

  // In the browser land, the key is required on the settings, so we can bind it to getTretment/s
  client.getTreatment = client.getTreatment.bind(client, settings.core.key);
  client.getTreatments = client.getTreatments.bind(client, settings.core.key);

  // Key is also binded to the .track method. Same thing happens with trafficType but only if present on configs. (not required)
  const trackBindings = [settings.core.key];
  if (tt) {
    trackBindings.push(tt);
  }
  client.track = client.track.bind(client, ...trackBindings);

  return client;
}

export default FixKey;
