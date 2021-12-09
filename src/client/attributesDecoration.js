import ClientWithInputValidationLayer from './inputValidation';
import AttributesCacheInMemory from '../storage/AttributesCache/InMemory';
import { validateAttributesDeep } from '../utils/inputValidation/attributes';
import logFactory from '../utils/logger';
const log = logFactory('splitio-client');

function ClientAttributesDecorationLayer(context, isKeyBinded, isTTBinded) {

  const client = ClientWithInputValidationLayer(context, isKeyBinded, isTTBinded);

  const attributeStorage = new AttributesCacheInMemory();

  /**
   * Add an attribute to client's in memory attributes storage
   * 
   * @param {string} attributeName Attrinute name
   * @param {string, number, boolean, list} attributeValue Attribute value
   * @returns {boolean} true if the attribute was stored and false otherways
   */
  client.setAttribute = (attributeName, attributeValue) => {
    const attribute = {};
    attribute[attributeName] = attributeValue;
    log.debug(`[Attribute Decoration] store ${attributeValue} for attribute ${attributeName}`);
    if (!validateAttributesDeep(attribute)) return false;
    return attributeStorage.setAttribute(attributeName, attributeValue);
  };

  /**
   * Returns the attribute with the given key
   * 
   * @param {string} attributeName Attribute name
   * @returns {Object} Attribute with the given key
   */
  client.getAttribute = (attributeName) => {
    log.debug(`[Attribute Decoration] retrieved attribute ${attributeName+''}`);
    return attributeStorage.getAttribute(attributeName+'');
  };

  /**
   * Add to client's in memory attributes storage the attributes in 'attributes'
   * 
   * @param {Object} attributes Object with attributes to store
   * @returns true if attributes were stored an false otherways
   */
  client.setAttributes = (attributes) => {
    if (!validateAttributesDeep(attributes)) return false;
    return attributeStorage.setAttributes(attributes);
  };

  /**
   * Return all the attributes stored in client's in memory attributes storage
   * 
   * @returns {Object} returns all the stored attributes
   */
  client.getAttributes = () => {
    return attributeStorage.getAll();
  };

  /**
   * Removes from client's in memory attributes storage the attribute with the given key
   * 
   * @param {string} attributeName 
   * @returns {boolean} true if attribute was removed and false otherways
   */
  client.removeAttribute = (attributeName) => {
    log.debug(`[Attribute Decoration] removed attribute ${attributeName+''}`);
    return attributeStorage.removeAttribute(attributeName+'');
  };

  /**
   * Remove all the stored attributes in the client's in memory attribute storage
   */
  client.clearAttributes = () => {
    return attributeStorage.clear();
  };

  return client;
}

export default ClientAttributesDecorationLayer;