export default class AuthClient {

  static getInstance() {
    return new AuthClient();
  }

  // - Properties:

  constructor() {
    // @TODO implement the real function
  }

  authenticate(authorizationKey, splitKeys) {
    // @TODO implement the real function
    authorizationKey;
    splitKeys;
    return Promise.resolve({ jwt: 'jwt', channels: 'channels', ttl: 1 });
  }
}