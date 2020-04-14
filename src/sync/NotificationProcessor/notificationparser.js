import { PushEventTypes } from '../constants';

export function errorParser(error) {
  // @TODO remove or review if some additional parsing is needed for some errors
  return error;
}

export function messageParser(message) {
  const messageData = JSON.parse(message.data);
  messageData.data = JSON.parse(messageData.data);

  // set the event type to OCCUPANCY, to handle all events uniformely
  if (messageData.name && messageData.name === '[meta]occupancy')
    messageData.data.type = PushEventTypes.OCCUPANCY;

  return messageData;
}