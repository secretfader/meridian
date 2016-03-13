import {
  createFetch,
  base,
  method,
  header,
  parseJSON
} from 'http-client';

export default function httpClient(options = {}) {
  if (!canActivate(options)) {
    return Promise.reject(new Error('invalid client options.'));
  }

  options = {
    method: 'get',
    type: 'application/vnd.api+json',
    field: 'jsonData',
    endpoint: '/',
    ...options
  };

  const request = createFetch(
    base(options.base),
    method(mapAction(options)),
    header('Content-Type', options.type),
    header('Accept', options.type),
    parseJSON(options.field)
  ); 

  return (locals) => {
    const { endpoint } = locals;
    return request(endpoint).then(pick(options.field));
  }
}

export function pick(field = 'jsonData') {
  return response => response[field];
} 

export function mapAction({ method }) {
  switch (method) {
    case 'create':
      return 'post';
    case 'update':
      return 'patch';
    case 'delete':
      return 'delete';
    case 'remove':
      return 'delete';
    case 'destroy':
      return 'delete';
    default:
      return 'get';
  }
}

export function canActivate(options = {}) {
  if (options.base) { return true; }
  return false;
}
