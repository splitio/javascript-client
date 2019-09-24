# Split SDK for Javascript

[![Build Status](https://travis-ci.com/splitio/javascript-client.svg?branch=master)](https://travis-ci.com/splitio/javascript-client)
[![Greenkeeper badge](https://badges.greenkeeper.io/splitio/javascript-client.svg)](https://greenkeeper.io/)
[![npm version](https://badge.fury.io/js/%40splitsoftware%2Fsplitio.svg)](https://badge.fury.io/js/%40splitsoftware%2Fsplitio)

## Overview
This SDK is designed to work with [Split](https://www.split.io), the platform for controlled rollouts, serving features to your users via the Split feature flag to manage your complete customer experience.

[![Twitter Follow](https://img.shields.io/twitter/follow/splitsoftware.svg?style=social&label=Follow&maxAge=1529000)](https://twitter.com/intent/follow?screen_name=splitsoftware)

## Compatibility
The JavaScript SDK is an isomorphic library for both Node.js and Web browser environments.

It supports Node.js version 4.x or later, and can be used in all major browsers. However, not all browsers have native support for the used APIs, such as ES6 Promises. The standard solution for this is to use [polyfills](https://github.com/stefanpenner/es6-promise). 

## Getting started

Below is a simple Node.js example that describes the instantiation and most basic usage of our SDK:
```javascript
// Import the SDK
var SplitFactory = require('@splitsoftware/splitio').SplitFactory;

// Instantiate the SDK
var factory = SplitFactory({
  core: {
    authorizationKey: 'YOUR_API_KEY'
  }
});

// Get the client instance you'll use
var client = factory.client();

// Set a callback to listen for the SDK_READY event, to make sure the SDK is properly loaded before asking it for a treatment
client.on(client.Event.SDK_READY, function() {
  var treatment = client.getTreatment('CUSTOMER_ID', 'SPLIT_NAME');
  if (treatment == 'on') {
      // insert code here to show on treatment
  } else if (treatment == 'off') {
      // insert code here to show off treatment
  } else {
      // insert your control treatment code here
  }
});
```

Please refer to [JavaScript SDK (client-side)](https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK) or [Node.js SDK (server-side)](https://help.split.io/hc/en-us/articles/360020564931-Node-js-SDK) to learn about all the functionality provided by our SDK and the configuration options available for tailoring it to your current application setup.

## Submitting issues
Split team monitors all issues submitted to this [issue tracker](https://github.com/splitio/javascript-client/issues). We encourage to use this issue tracker to submit any bug report, feedback and feature enhancements. We'll do our best to respond in a timely manner.

## Contributing
Please see [Contributors Guide](CONTRIBUTORS-GUIDE.md) to find all you need to submit a PR. 

## License
Licensed under the Apache License, Version 2.0. See: [Apache License](http://www.apache.org/licenses/).
 
## About Split
 
Split is the leading Feature Delivery Platform for engineering teams that want to confidently release features as fast as they can develop them.
Split’s fine-grained management, real-time monitoring, and data-driven experimentation ensure that new features will improve customer experience without breaking or degrading performance.
Companies like Twilio, Salesforce, GoDaddy and WePay trust Split to power their feature delivery.
 
To learn more about Split, contact [hello@split.io](mailto:hello@split.io), or get started with feature flags for free at https://www.split.io/signup.
 
Split has built and maintains a SDKs for:
 
* Java [Github](https://github.com/splitio/java-client) [Docs](http://docs.split.io/docs/java-sdk-guide)
* Javascript [Github](https://github.com/splitio/javascript-client) [Docs](http://docs.split.io/docs/javascript-sdk-overview)
* Node [Github](https://github.com/splitio/javascript-client) [Docs](http://docs.split.io/docs/nodejs-sdk-overview)
* .NET [Github](https://github.com/splitio/.net-core-client) [Docs](http://docs.split.io/docs/net-sdk-overview)
* Ruby [Github](https://github.com/splitio/ruby-client) [Docs](http://docs.split.io/docs/ruby-sdk-overview)
* PHP [Github](https://github.com/splitio/php-client) [Docs](http://docs.split.io/docs/php-sdk-overview)
* Python [Github](https://github.com/splitio/python-client) [Docs](http://docs.split.io/docs/python-sdk-overview)
* GO [Github](https://github.com/splitio/go-client) [Docs](http://docs.split.io/docs/go-sdk-overview)
* Android [Github](https://github.com/splitio/android-client) [Docs](https://docs.split.io/docs/android-sdk-overview)
* IOS [Github](https://github.com/splitio/ios-client) [Docs](https://docs.split.io/docs/ios-sdk-overview)
 
For a comprehensive list of opensource projects visit our [Github page](https://github.com/splitio?utf8=%E2%9C%93&query=%20only%3Apublic%20).
 
**Learn more about Split:**
 
Visit [split.io/product](https://www.split.io/product) for an overview of Split, or visit our documentation at [docs.split.io](http://docs.split.io) for more detailed information.
