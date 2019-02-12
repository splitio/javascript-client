import ClientWithInputValidationLayer from './inputValidation';

export default function NodeClientFactory(context) {
  const client = ClientWithInputValidationLayer(context);
  client.isBrowserClient = false;

  return client;
}
