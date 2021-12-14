import ClientInputValidationLayer from './inputValidation';
import AttributesCacheInMemory from '../storage/AttributesCache/InMemory';
import { validateAttributesDeep } from '../utils/inputValidation/attributes';
import logFactory from '../utils/logger';
import objectAssign from 'object-assign';
const log = logFactory('splitio-client');

/**
 * Add in memory attributes storage methods and combine them with any attribute received from the getTreatment/s call 
 */
export default function ClientAttributesDecorationLayer(context, isKeyBinded, isTTBinded) {

  const client = ClientInputValidationLayer(context, isKeyBinded, isTTBinded);

  const attributeStorage = new AttributesCacheInMemory();

  // Keep a reference to the original methods
  const clientGetTreatment = client.getTreatment;
  const clientGetTreatmentWithConfig = client.getTreatmentWithConfig;
  const clientGetTreatments = client.getTreatments;
  const clientGetTreatmentsWithConfig = client.getTreatmentsWithConfig;

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
    log.debug(`[Attribute Decoration] retrieved attribute ${attributeName + ''}`);
    return attributeStorage.getAttribute(attributeName + '');
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
    log.debug(`[Attribute Decoration] removed attribute ${attributeName + ''}`);
    return attributeStorage.removeAttribute(attributeName + '');
  };

  /**
   * Remove all the stored attributes in the client's in memory attribute storage
   */
  client.clearAttributes = () => {
    return attributeStorage.clear();
  };

  client.getTreatment = (maybeKey, maybeSplit, maybeAttributes) => {
    return clientGetTreatment(maybeKey, maybeSplit, combineAttributes(maybeAttributes));
  };

  client.getTreatmentWithConfig = (maybeKey, maybeSplit, maybeAttributes) => {
    return clientGetTreatmentWithConfig(maybeKey, maybeSplit, combineAttributes(maybeAttributes));
  };

  client.getTreatments = (maybeKey, maybeSplits, maybeAttributes) => {
    return clientGetTreatments(maybeKey, maybeSplits, combineAttributes(maybeAttributes));
  };

  client.getTreatmentsWithConfig = (maybeKey, maybeSplits, maybeAttributes) => {
    return clientGetTreatmentsWithConfig(maybeKey, maybeSplits, combineAttributes(maybeAttributes));
  };

  function combineAttributes(maybeAttributes) {
    const storedAttributes = attributeStorage.getAll();
    if (Object.keys(storedAttributes).length > 0) {
      return objectAssign({}, storedAttributes, maybeAttributes);
    }
    return maybeAttributes;
  }

  return client;
}
