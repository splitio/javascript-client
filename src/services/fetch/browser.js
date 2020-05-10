import unfetch from 'unfetch';

export default window && window.fetch || unfetch;
