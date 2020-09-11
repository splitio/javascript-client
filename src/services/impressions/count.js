import objectAssign from 'object-assign';
import base from '../request';

export default function COUNT(settings, params) {
  return base(settings, '/testImpressions/count', objectAssign({
    method: 'POST'
  }, params));
}
