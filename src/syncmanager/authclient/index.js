export default class AuthClient {

  static getInstance() {
    return new AuthClient();
  }

  // - Properties:

  constructor() {
    // @TODO implement the real function
  }

  authenticate(authorizationKey) {
    // @TODO implement the real function
    authorizationKey;
    return Promise.resolve({ jwt: 'jwt', channels: 'channels', ttl: 1 });
  }
}