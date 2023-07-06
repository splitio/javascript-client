# Split SDK for JavaScript

[![npm version](https://badge.fury.io/js/%40splitsoftware%2Fsplitio.svg)](https://badge.fury.io/js/%40splitsoftware%2Fsplitio) [![Build Status](https://github.com/splitio/javascript-client/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/splitio/javascript-client/actions/workflows/ci-cd.yml) [![Greenkeeper badge](https://badges.greenkeeper.io/splitio/javascript-client.svg)](https://greenkeeper.io/)

## Overview
This SDK is designed to work with Split, the platform for controlled rollouts, which serves features to your users via feature flags to manage your complete customer experience.

[![Twitter Follow](https://img.shields.io/twitter/follow/splitsoftware.svg?style=social&label=Follow&maxAge=1529000)](https://twitter.com/intent/follow?screen_name=splitsoftware)

## Compatibility
The JavaScript SDK is an isomorphic library for both Node.js and Web browser environments.

It supports **Node.js version 6.x and npm 3.x or later**.

For browsers it supports **IE10+ and all the other major browsers**. *However, IE doesn't have native support for Promises, which we require to properly work. If you're targeting IE it's up to you to provide Promises support. You should include a polyfill like [es6-promise](https://github.com/stefanpenner/es6-promise).*

## Getting started
Below is a simple Node.js example that describes the instantiation and most basic usage of our SDK:
```javascript
// Import the SDK
var SplitFactory = require('@splitsoftware/splitio').SplitFactory;

// Instantiate the SDK
var factory = SplitFactory({
  core: {
    authorizationKey: 'YOUR_SDK_KEY'
  }
});

// Get the client instance you'll use
var client = factory.client();

// Set a callback to listen for the SDK_READY event, to make sure the SDK is properly loaded before asking for a treatment
client.on(client.Event.SDK_READY, function() {
  var treatment = client.getTreatment('CUSTOMER_ID', 'FEATURE_FLAG_NAME');
  if (treatment == 'on') {
    // insert code here for on treatment
  } else if (treatment == 'off') {
    // insert code here for off treatment
  } else {
    // insert your control treatment code here
  }
});
```

Please refer to [JavaScript SDK (client-side)](https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK) or [Node.js SDK (server-side)](https://help.split.io/hc/en-us/articles/360020564931-Node-js-SDK) to learn about all the functionality provided by our SDK as well as specifics for each environment and the configuration options available for tailoring it to your current application setup.

## Submitting issues
The Split team monitors all issues submitted to this [issue tracker](https://github.com/splitio/javascript-client/issues). We encourage you to use this issue tracker to submit any bug reports, feedback, and feature enhancements. We'll do our best to respond in a timely manner.

## Contributing
Please see [Contributors Guide](CONTRIBUTORS-GUIDE.md) to find all you need to submit a Pull Request (PR).

## License
Licensed under the Apache License, Version 2.0. See: [Apache License](http://www.apache.org/licenses/).

## About Split

Split is the leading Feature Delivery Platform for engineering teams that want to confidently deploy features as fast as they can develop them. Split’s fine-grained management, real-time monitoring, and data-driven experimentation ensure that new features will improve the customer experience without breaking or degrading performance. Companies like Twilio, Salesforce, GoDaddy and WePay trust Split to power their feature delivery.

To learn more about Split, contact hello@split.io, or get started with feature flags for free at https://www.split.io/signup.

Split has built and maintains SDKs for:

* .NET [Github](https://github.com/splitio/dotnet-client) [Docs](https://help.split.io/hc/en-us/articles/360020240172--NET-SDK)
* Android [Github](https://github.com/splitio/android-client) [Docs](https://help.split.io/hc/en-us/articles/360020343291-Android-SDK)
* Angular [Github](https://github.com/splitio/angular-sdk-plugin) [Docs](https://help.split.io/hc/en-us/articles/6495326064397-Angular-utilities)
* GO [Github](https://github.com/splitio/go-client) [Docs](https://help.split.io/hc/en-us/articles/360020093652-Go-SDK)
* iOS [Github](https://github.com/splitio/ios-client) [Docs](https://help.split.io/hc/en-us/articles/360020401491-iOS-SDK)
* Java [Github](https://github.com/splitio/java-client) [Docs](https://help.split.io/hc/en-us/articles/360020405151-Java-SDK)
* JavaScript [Github](https://github.com/splitio/javascript-client) [Docs](https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK)
* JavaScript for Browser [Github](https://github.com/splitio/javascript-browser-client) [Docs](https://help.split.io/hc/en-us/articles/360058730852-Browser-SDK)
* Node [Github](https://github.com/splitio/javascript-client) [Docs](https://help.split.io/hc/en-us/articles/360020564931-Node-js-SDK)
* PHP [Github](https://github.com/splitio/php-client) [Docs](https://help.split.io/hc/en-us/articles/360020350372-PHP-SDK)
* Python [Github](https://github.com/splitio/python-client) [Docs](https://help.split.io/hc/en-us/articles/360020359652-Python-SDK)
* React [Github](https://github.com/splitio/react-client) [Docs](https://help.split.io/hc/en-us/articles/360038825091-React-SDK)
* React Native [Github](https://github.com/splitio/react-native-client) [Docs](https://help.split.io/hc/en-us/articles/4406066357901-React-Native-SDK)
* Redux [Github](https://github.com/splitio/redux-client) [Docs](https://help.split.io/hc/en-us/articles/360038851551-Redux-SDK)
* Ruby [Github](https://github.com/splitio/ruby-client) [Docs](https://help.split.io/hc/en-us/articles/360020673251-Ruby-SDK)

For a comprehensive list of open source projects visit our [Github page](https://github.com/splitio?utf8=%E2%9C%93&query=%20only%3Apublic%20).

**Learn more about Split:**

Visit [split.io/product](https://www.split.io/product) for an overview of Split, or visit our documentation at [help.split.io](http://help.split.io) for more detailed information.
