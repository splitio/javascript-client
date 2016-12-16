module.exports = (key) => {
  if (typeof key === 'string') {
    return {
      matchingKey: key,
      bucketingKey: key
    };
  }

  if (typeof key === 'object') {
    if (!key.bucketingKey || !key.matchingKey) {
      throw 'key object should need property bucketingKey';
    }

    return key;
  }

  throw 'key should be a object or a string';
};
