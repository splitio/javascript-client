const fetch = require('node-fetch');

export default global && global.fetch || fetch;
