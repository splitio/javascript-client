import { OCCUPANCY } from '../constants';
import { isString } from '../../utils/lang';

export function errorParser(error) {
  // HTTP errors handled by Ably (e.g., 400 due to invalid token, 401 due to expired token, 500) have a data object
  if (isString(error.data))
    error.parsedData = JSON.parse(error.data); // cannot assign to read only property 'data'

  return error;
}

export function messageParser(message) {
  const messageData = JSON.parse(message.data);
  messageData.parsedData = JSON.parse(messageData.data);

  // set the event type to OCCUPANCY, to handle all events uniformely
  if (messageData.name && messageData.name === '[meta]occupancy')
    messageData.parsedData.type = OCCUPANCY;

  return messageData;
}