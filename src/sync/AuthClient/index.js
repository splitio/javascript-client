import authService from '../../services/auth';
import authRequest from '../../services/auth/auth';
import { decodeJWTtoken } from '../../utils/jwt';

/**
 * Run authentication requests to Auth Server, and handle response decoding the JTW token.
 * Precondition:
 *
 * @param {Object} settings Split factory config, used to get authorizationKey and other params required by authRequest.
 * @param {Object} userKeys set of user Keys to track MY_SEGMENTS_CHANGES. It is an empty object for Node.
 * @throws {ReferenceError} if `atob` function is not defined
 */
export default function authenticate(settings, userKeys) {
  let authPromise = authService(authRequest(settings, userKeys)); // errors handled by authService
  return authPromise
    .then(resp => resp.data)
    .then(json => {
      return {
        ...json,
        decodedToken: decodeJWTtoken(json.token),
      };
    });
}