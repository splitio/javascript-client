# Migrating to JavaScript SDK v11

JavaScript SDK v11.0.0 has a few breaking changes that you should consider when migrating from version 10.x.x.

## Changes that affect server-side API (NodeJS)

While JavaScript SDK previously supported NodeJS v6 and above, the SDK now requires NodeJS v14 or above.

## Changes that affect client-side API (Browser)

Below you will find a list of the changes:

- **Removed the `core.trafficType` configuration option (`SplitIO.IBrowserSettings['core']['trafficType]`) and the `trafficType` parameter from the SDK `client()` method in Browser (`SplitIO.IBrowserSDK['client']`). As a result, traffic types can no longer be bound to SDK clients, and the traffic type must be provided in the `track` method.**

This change was made to align the SDK with the client-side APIs of the [Browser SDK](https://help.split.io/hc/en-us/articles/360058730852-Browser-SDK) and [React Native SDK](https://help.split.io/hc/en-us/articles/4406066357901-React-Native-SDK).

SDK clients cannot be bound to a traffic type anymore, and so the traffic type must be provided when calling the `client.track` method. For example:

```javascript
// JS SDK v10.x.x
const factory = SplitFactory({
  core: {
    authorizationKey: '...',
    key: USER_KEY,
    trafficType: 'user'
  }
});

const client = factory.client();
const accountClient = factory.client(ACCOUNT_ID, 'account');

client.track('my_event');
accountClient.track('my_event');
```

should be replaced with:

```javascript
// JS SDK v11.0.0
const factory = SplitFactory({
  core: {
    authorizationKey: '...',
    key: USER_KEY
  }
});

const client = factory.client();
const accountClient = factory.client(ACCOUNT_ID);

client.track('usuer', 'my_event');
accountClient.track('account', 'my_event');
```

- **Removed the deprecated `GOOGLE_ANALYTICS_TO_SPLIT` and `SPLIT_TO_GOOGLE_ANALYTICS` integrations. The `integrations` configuration option has been removed from the SDK factory configuration, along with the associated interfaces in the TypeScript definitions.**

The Google Analytics integrations were removed since they integrate with the *Google Universal Analytics* library, which was shut down on July 1, 2024, and [replaced by *Google Analytics 4*](https://support.google.com/analytics/answer/11583528?hl=en). Check [this docs](https://help.split.io/hc/en-us/articles/360040838752-Google-Analytics#google-analytics-4-ga4) for more information on how to integrate Split with Google Analytics 4.

The integrations have stopped being used and maintained, and were removed from the SDK, together with the `integrations` configuration option. If you were using the `integrations` option, you should remove it from your SDK configuration object.

- **Removed internal ponyfills for the `Map` and `Set` global objects, dropping support for IE and other outdated browsers.**

The SDK no longer ships with internal implementations for the `Map` and `Set` global objects, which were used to support old browsers like IE.

If you need to target environments that do not support these features natively, you should provide a polyfill for them. For example, [es6-map](https://github.com/medikoo/es6-map) for `Map`, and [es6-set](https://github.com/medikoo/es6-set) for `Set`.

- **Dropped support for Split Proxy below version 5.9.0, when using in the browser (client-side API). The SDK now requires Split Proxy 5.9.0 or above.**

If using the Split Proxy with the SDK in the browser, make sure to update it to version 5.9.0 or above. This is required due to the introduction of Large Segments matchers in the SDK on client-side, which uses a new HTTP endpoint to retrieve the segments data and is only supported by Split Proxy 5.9.0.
