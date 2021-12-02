import ClientWithInputValidationLayer from './inputValidation';
import AttributesCacheInMemory from '../storage/AttributesCache/InMemory';

function ClientAttributesDecorationLayer(context, isKeyBinded, isTTBinded) {

  const client = ClientWithInputValidationLayer(context, isKeyBinded, isTTBinded);

  const attributeStorage = new AttributesCacheInMemory();

  client.setAttribute = (attributeName, attributeValue) => {
    return attributeStorage.setAttribute(attributeName, attributeValue);
  };

  client.getAttribute = (attributeName) => {
    return attributeStorage.getAttribute(attributeName);
  };

  client.setAttributes = (attributes) => {
    return attributeStorage.setAttributes(attributes);
  };

  client.getAttributes = () => {
    return attributeStorage.getAll();
  };

  client.removeAttribute = (attributeName) => {
    return attributeStorage.removeAttribute(attributeName);
  };

  client.clearAttributes = () => {
    return attributeStorage.clear();
  };

  return client;
}

export default ClientAttributesDecorationLayer;