export function errorParser(error) {
  // @TODO review
  return error;
}

export function messageParser(message) {
  const messageData = JSON.parse(message.data);
  messageData.data = JSON.parse(messageData.data);
  return messageData;
}