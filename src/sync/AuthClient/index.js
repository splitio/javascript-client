import objectAssign from 'object-assign';
import authService from '../../services/auth';
import authRequest from '../../services/auth/auth';
import { decodeJWTtoken } from '../../utils/jwt';

/**
 * Run authentication requests to Auth Server, and handle response decoding the JTW token.
 * Precondition:
 *
 * @param {Object} settings Split factory config, used to get authorizationKey and other params required by authRequest.
 * @param {string[] | undefined} userKeys set of user Keys to track MY_SEGMENTS_CHANGES. It is undefined for Node.
 * @throws {ReferenceError} if `atob` function is not defined
 */
export default function authenticate(settings, userKeys) {
  let authPromise = authService(authRequest(settings, userKeys)); // errors handled by authService
  return authPromise
    // no need to handle json parsing errors as SplitError, since no user callbacks are executed after this promise is resolved
    .then(resp => resp.json())
    .then(json => {
      if (json.token) { // empty token when `"pushEnabled": false`
        const decodedToken = decodeJWTtoken(json.token);
        if (typeof decodedToken.iat !== 'number' || typeof decodedToken.exp !== 'number') throw new Error('token properties "issuedAt" (iat) or "expiration" (exp) are missing or invalid');
        const channels = JSON.parse(decodedToken['x-ably-capability']);
        return objectAssign({
          decodedToken,
          channels
        }, json);
      }
      return json;
    });
}
