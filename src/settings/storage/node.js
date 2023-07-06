import { LOCALHOST_MODE, STORAGE_MEMORY, STORAGE_REDIS, CONSUMER_MODE, STANDALONE_MODE } from '@splitsoftware/splitio-commons/src/utils/constants';

export function validateStorage(settings) {
  const {
    log,
    mode,
    storage: {
      type,
      options = {},
      prefix
    } = { type: STORAGE_MEMORY }
  } = settings;

  // We can have MEMORY, REDIS or an invalid storage type
  switch (type) {
    case STORAGE_REDIS: {
      // If passing REDIS storage in localhost or standalone mode, we log an error and fallback to MEMORY storage
      if (mode === STANDALONE_MODE || mode === LOCALHOST_MODE) {
        log.error('The provided REDIS storage is invalid for this mode. It requires consumer mode. Fallbacking into default MEMORY storage.');
        return {
          type: STORAGE_MEMORY,
          prefix
        };
      }
      let {
        host,
        port,
        db,
        pass,
        url,
        tls,
        connectionTimeout,
        operationTimeout
      } = options;

      if (process.env.REDIS_HOST)
        host = process.env.REDIS_HOST;
      if (process.env.REDIS_PORT)
        port = process.env.REDIS_PORT;
      if (process.env.REDIS_DB)
        db = process.env.REDIS_DB;
      if (process.env.REDIS_PASS)
        pass = process.env.REDIS_PASS;
      if (process.env.REDIS_URL)
        url = process.env.REDIS_URL;

      const newOpts = {
        connectionTimeout, operationTimeout
      };

      if (url) {
        newOpts.url = url;
      } else {
        newOpts.host = host;
        newOpts.port = port;
        newOpts.db = db;
        newOpts.pass = pass;
      }

      if (tls) {
        newOpts.tls = tls;
      }

      return {
        type,
        prefix,
        options: newOpts
      };
    }

    // For now, we don't have modifiers or settings for MEMORY in NodeJS
    case STORAGE_MEMORY:
    default: {
      // If passing MEMORY storage in consumer mode, throw an error (no way to fallback to REDIS storage)
      if (mode === CONSUMER_MODE) throw new Error('A REDIS storage is required on consumer mode');
      // If passing an invalid storage type, log an error
      if (type !== STORAGE_MEMORY) log.error(`The provided '${type}' storage type is invalid. Fallbacking into default MEMORY storage.`);
      return {
        type: STORAGE_MEMORY,
        prefix
      };
    }
  }
}
