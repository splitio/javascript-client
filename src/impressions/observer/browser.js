import ImpressionObserver from './observer';
import { hashImpression32 } from '../hasher/hashImpression32';

const LAST_SEEN_CACHE_SIZE = 500; // cache up to 500 impression hashes

const BrowserImpressionObserverFactory = () => new ImpressionObserver(LAST_SEEN_CACHE_SIZE, hashImpression32);

export default BrowserImpressionObserverFactory;
