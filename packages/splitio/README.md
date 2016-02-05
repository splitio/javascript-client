# SPLIT SDK for NodeJS

This package provides support for NodeJS implementations. [demo!](../demos/express-split).

## Usage

1. `npm install --save @splitsoftware/splitio`
2. Please use the following snippet in your demo app:

```js
const SPLIT_TOKEN = 'epa57jv812r4602iu43no8jm1h';
const splitEngine = require('@splitsoftware/splitio');

splitEngine(SPLIT_TOKEN).then((/* engine ready */) => {
  console.log('Is "my_sample_feature" available? => ', splitEngine.isOn('my_sample_feature') ? 'yes' : 'no');
})
.catch((error) => {
  console.log('Something went wrong while doing the startup of Split');
});
```

## API

### isOn(key :string, featureName :string) :boolean

Given a key and a featureName, ask the engine if the feature is available for
the given key.
