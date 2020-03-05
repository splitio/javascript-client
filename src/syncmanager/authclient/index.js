export default class AuthClient {

  static getInstance() {
    return new AuthClient();
  }

  // - Properties:

  constructor() {

  }

  authenticate(authorizationKey) {
    // @TODO implement the real function
    return Promise.resolve({ jwt: 'jwt', channels: 'channels', ttl: 1, authorizationKey });
  }
}