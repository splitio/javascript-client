import authService from '../../services/auth';
import authRequest from '../../services/auth/auth';
import { decodeJWTtoken } from '../../utils/lang';

export default function authenticate(settings, splitKeys) {
  // @TODO handle catch to parse errors for pushmanager
  let authPromise = authService(authRequest(settings, splitKeys));
  return authPromise
    .then(resp => resp.data)
    .then(json => {
      return {
        ...json,
        decodedToken: decodeJWTtoken(json.token),
      };
    });
}