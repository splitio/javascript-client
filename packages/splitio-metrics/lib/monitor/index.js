'use strict';

var factories = {
  SequentialCollector: require('../collector/secuential'),
  FibonacciCollector: require('../collector/fibonacci')
};

var collectors = {
  'segmentChangeFetcher.time': factories.SequentialCollector(),
  'segmentChangeFetcher.status.XXX': factories.SequentialCollector(),
  'segmentChangeFetcher.exception': factories.SequentialCollector(),

  'splitChangeFetcher.time': factories.SequentialCollector(),
  'splitChangeFetcher.status.XXX': factories.SequentialCollector(),
  'splitChangeFetcher.exception': factories.SequentialCollector(),

  'sdk.getTreatment': factories.FibonacciCollector()
};

module.exports.collectors = collectors;
//# sourceMappingURL=index.js.map