# Split SDK for JavaScript

Split SDK is the library you should use for integrate [Split](http://split.io/)
into your web platform.


### How to install

Using [npm](https://www.npmjs.com/):

    $ npm install --save @splitsoftware/splitio

Then with a module bundler like [webpack](https://webpack.github.io/) that supports
either **CommonJS** or **ES2015** modules, use as you would anything else:

JavaScript
```js
// using es modules
import { SplitFactory } from '@splitsoftware/splitio';

// using common js
const SplitFactory = require('@splitsoftware/splitio').SplitFactory;
```

TypeScript
```typescript
// using es modules
import { SplitFactory } from '@splitsoftware/splitio';

// using common js
import { SplitFactory } = require('@splitsoftware/splitio');
```

Using [bower](https://bower.io):

    $ bower install splitio=https://cdn.split.io/sdk/split-{version}.min.js

And finally, the **UMD** build is also available in our **CDN**:

```html
<script src="//cdn.split.io/sdk/split-{version}.min.js"></script>
```

You can find the library on `window.splitio`.

### Promise

Split sdk depends on a native ES6 Promise implementation to be supported. If
your environment doesn't support ES6 Promises, you can [polyfill](https://github.com/stefanpenner/es6-promise).

### Logging

Our SDK offers some logs that will help you and our support team in debugging different situations.
Those logs can be enabled or disabled (default is disabled) but you can also set the log level.

We offer five log levels: **DEBUG, INFO, WARN, ERROR** and **NONE**.

_**DEBUG** is the log level you get when you just enable the logs, every log is shown._
_**NONE** is the log level you get when disabling the logs, no log is shown._

We have three ways for interacting with the logger, which you can find below. Choose the one that fits better on your code and use case.

### LocalStorage (Browser) or ENV Variable (Node)

Depending on where your code is running, you can set a global value for the SDK. Both options accept the same values.

For enabling the logs (DEBUG log level):
- 'on'
- 'enable'
- 'enabled'

For setting a custom log level:
- 'DEBUG'
- 'INFO'
- 'WARN'
- 'ERROR'
- 'NONE'

**if you're on the browser**, you need to set the `splitio_debug` value on your localStorage. Easiest way would be to execute the following
sentence on your console, of course using the value of choice:

```js
localStorage.setItem('splitio_debug', 'on');
```

**if you're on node**, you need to set the `SPLITIO_DEBUG` environment variable. Depending on your setup there are a lot of ways, but if you are
executing your script and want some logs, you can just set that up on the command line:

```bash
SPLITIO_DEBUG='on' node myApp.js
```

#### Via settings

When you specify the debug flag of your settings:

```js
var sdk = SplitFactory({
  core: {
    authorizationKey: 'YOUR_API_KEY',
    key: 'CUSTOMER_ID'
  },
  debug: true
});
```

The **debug** property can either be a boolean (true/false) or the string of one of the Log Levels.

#### Programatically

The instantiated factory offers three methods, `enable`, `disable` and `setLogLevel`. The names are self explanatory.

```js
var sdk = SplitFactory({
  core: {
    authorizationKey: 'YOUR_API_KEY',
    key: 'CUSTOMER_ID'
  }
});
// To enable all the logs, would set DEBUG log level.
sdk.Logger.enable();
// To disable all the logs, would set NONE log level.
sdk.Logger.disable();
// Or you can set the desired log level
sdk.Logger.setLogLevel('DEBUG');
sdk.Logger.setLogLevel('INFO');
sdk.Logger.setLogLevel('WARN');
sdk.Logger.setLogLevel('ERROR');
```

#### Migration v9 to v10

We migrated our source code to ESM and exposed
a new way to import our SDK to take
advantage of the ESM modules.

Before v10 we expose a function
```js
import splitio from '@splitsoftware/splitio';

const sdk = splitio(settings);
```

In V10 we expose an object with SplitFactory as a factory function to be consumed.
```js
import { SplitFactory } from '@splitsoftware/splitio';

const sdk = SplitFactory(settings);
```

For UMD build we continue exporting the same factory function

```html
<script src="//cdn.split.io/split-10.0.0.min.js"></script>
```

```js
const sdk = window.splitio(settings);

// or

const sdk = splitio(settings);
```

#### Migration v7 to v8

If you are comming from v7 and wants to use v8 without apply changes into your
code, we have provided a migration bundle which decorates the new API simulating
the old one:

In the browser you were probably using something like:

```html
<script src="//cdn.split.io/split-7.6.0.min.js"></script>
```

Now you should use:

```html
<script src="//cdn.split.io/sdk/split-migration-8.2.0.min.js"></script>
```

In CommonJS environments (even using ES6 modules), you should require/import:

```js
// using an ES6 transpiler, like babel
import splitio from '@splitsoftware/splitio/migration';

// not using an ES6 transpiler
const splitio = require('@splitsoftware/splitio/migration');
```


### Usage documentation
- [Getting stared](http://docs.split.io/docs/getting-started)
- [JS SDK overview](http://docs.split.io/docs/javascript-sdk-overview)
- [NodeJS SDK overview](http://docs.split.io/docs/nodejs-sdk-overview)


### Release documentation
- [Changes](CHANGES.txt)
- [News](NEWS.txt)
