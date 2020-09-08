import ImpressionObserver from './observer';
import hasher from '../hasher';

const LAST_SEEN_CACHE_SIZE = 500000; // cache up to 500k impression hashes

const NodeImpressionObserverFactory = () => {
  return {
    impressionObserver: new ImpressionObserver(LAST_SEEN_CACHE_SIZE, hasher.hashImpression128)
  };
};

export default NodeImpressionObserverFactory;
