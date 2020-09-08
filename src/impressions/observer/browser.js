import ImpressionObserver from './observer';
import hasher from '../hasher';

const LAST_SEEN_CACHE_SIZE = 500; // cache up to 500 impression hashes

const BrowserImpressionObserverFactory = () => {
  return {
    impressionObserver: new ImpressionObserver(LAST_SEEN_CACHE_SIZE, hasher.hashImpression32)
  };
};

export default BrowserImpressionObserverFactory;
