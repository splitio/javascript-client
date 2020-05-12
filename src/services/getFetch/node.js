const nodeFetch = require('node-fetch');

export default function getFetch() {
  return global && global.fetch || nodeFetch;
}