import ImpressionObserver from './observer';
import { hashImpression128 } from '../hasher/node';

const LAST_SEEN_CACHE_SIZE = 500000; // cache up to 500k impression hashes

const NodeImpressionObserverFactory = () => new ImpressionObserver(LAST_SEEN_CACHE_SIZE, hashImpression128);

export default NodeImpressionObserverFactory;
