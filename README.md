# Split SDK for JavaScript

Split SDK is the library you should use for integrate [Split](http://split.io/)
into your web platform.

Quick links:

- [CHANGES](./CHANGES.txt)
- [NEWS](./NEWS.txt)

## Example for the Browser

If you want an in depth intro, please read [here](http://docs.split.io/docs/javascript-sdk-overview),
but for a quick example:

```js
// SDK instantiation.
var sdk = splitio({
  core: {
    authorizationKey: 'c1l5vkd50gimccout3c03pntbu',  // [1] your API key
    key: '4a2c4490-ced1-11e5-9b97-d8a25e8b1578'      // [2] your customer id
  }
});

// SDK evaluation after initialization completed.
sdk.ready().then(function () {
  var treatment = sdk.getTreatment('payment_method');

  if (treatment === 'method_1') {
    // payment method 1
  } else if (treatment === 'method_2') {
    // payment method 2
  } else {
    // default payment method
  }
});
```

This example will allow you to **switch** between different treatments you have
created in the [split editor](http://docs.split.io/docs/using-the-split-editor).

## Example for the NodeJS (still WIP, not ready for production usage).

For NodeJS, we are allowed to evaluate multiple keys using the same instance, so
the API is is slightly different:

```js
// SDK instantiation.
var sdk = require('@splitsoftware/splitio')({
  core: {
    authorizationKey: 'c1l5vkd50gimccout3c03pntbu' // [1] your API key
  }
});

// SDK evaluation after initialization completed.
sdk.ready().then(function () {
  var treatment = sdk.getTreatment('4a2c4490-ced1-11e5-9b97-d8a25e8b1578', 'payment_method');

  if (treatment === 'method_1') {
    // payment method 1
  } else if (treatment === 'method_2') {
    // payment method 2
  } else {
    // default payment method
  }
});
```
