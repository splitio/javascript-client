import objectAssign from 'object-assign';

class AttributesCacheInMemory {

  constructor() {
    this.attributesCache = {};
  }

  /**
   * Create or update the value for the given attribute
   *
   * @param {string} attributeName attribute name
   * @param {Object} attributeValue attribute value
   * @returns {boolean} the attribute was stored
   */
  setAttribute(attributeName, attributeValue) {
    this.attributesCache[attributeName] = attributeValue;
    return true;
  }

  /**
   * Retrieves the value of a given attribute
   *
   * @param {string} attributeName attribute name
   * @returns {Object?} stored attribute value
   */
  getAttribute(attributeName) {
    return this.attributesCache[attributeName];
  }

  /**
   * Create or update all the given attributes
   *
   * @param {[string, Object]} attributes attributes to create or update
   * @returns {boolean} attributes were stored
   */
  setAttributes(attributes) {
    this.attributesCache = objectAssign(this.attributesCache, attributes);
    return true;
  }

  /**
   * Retrieve the full attributes map
   *
   * @returns {Map<string, Object>} stored attributes
   */
  getAll() {
    return this.attributesCache;
  }

  /**
   * Removes a given attribute from the map
   *
   * @param {string} attributeName attribute to remove
   * @returns {boolean} attribute removed
   */
  removeAttribute(attributeName) {
    if (Object.keys(this.attributesCache).indexOf(attributeName) >= 0) {
      delete this.attributesCache[attributeName];
      return true;
    }
    return false;
  }

  /**
   * Clears all attributes stored in the SDK
   *
   */
  clear() {
    this.attributesCache = {};
    return true;
  }

}

export default AttributesCacheInMemory;
