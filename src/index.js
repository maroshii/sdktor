import { get, post, put, del, patch } from 'superagent';
import partial from 'lodash/function/partial';
import merge from 'lodash/object/merge';

function requestFactory(baseUri, headers, fn) {
  const fabricateRequest = (path, callback) => {
    const req = fn(`${baseUri}${path || ''}`);
    Object.keys(headers).forEach(key => req.set(key, headers[key]));
    return req.end(callback);
  };
  return path => cb => fabricateRequest(path, cb);
}

function generateAPI(requestor) {
  return {
    get: requestor(get),
    post: requestor(post),
    put: requestor(put),
    del: requestor(del),
    patch: requestor(patch),
  };
}

function factory(baseUri, headers) {
  const requestor = partial(requestFactory, baseUri, headers);
  const api = generateAPI(requestor);

  api.at = (path, newHeaders) => {
    return factory(baseUri + path, merge({}, headers, newHeaders));
  };

  api.url = () => baseUri;

  return api;
}

export default factory;
