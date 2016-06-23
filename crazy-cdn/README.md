# Crazy CDN

The concept is a proxy which add delays and eventually errors in the services
using express middlewares.

## How to run

1. `nvm install v4`
2. `nvm use v4`
3. `npm install`
4. `npm run b`
5. `npm start`
6. `The proxy server is running in localhost:3000`

By default the target is hardcoded to be staging servers, but you could change
that quickly.

> HTTPS is disabled using a "un-secure" scheme because we are a man in the
  middle.

## How to development

1. `nvm install v4`
2. `nvm use v4`
3. `npm install`
4. `npm run w` => live recompilation on changes
5. `npm run m` => live nodejs reload after recompilation changes
6. `The proxy server is running in localhost:3000`
