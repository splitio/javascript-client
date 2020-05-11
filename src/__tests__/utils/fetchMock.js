import fetchMock from 'fetch-mock';

// config the fetch mock to chain routes (appends the new route to the list of routes)
fetchMock.config.overwriteRoutes = false;

// Single mock to init the setup of fetch-mock and overwrite the global fetch object.
// It is necessary because we use a local reference to fetch, that is a ponyfill if global fetch is not available.
fetchMock.once('fetch-mock', 200);

export default fetchMock;
