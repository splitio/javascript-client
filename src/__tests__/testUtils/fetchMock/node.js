import fetchMock from 'fetch-mock';
import { __setFetch } from '../../../platform/getFetch/node';

const sandboxFetchMock = fetchMock.sandbox();

// config the fetch mock to chain routes (appends the new route to the list of routes)
sandboxFetchMock.config.overwriteRoutes = false;

__setFetch(sandboxFetchMock);

export default sandboxFetchMock;
