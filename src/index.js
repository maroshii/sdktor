import { get, post, put, del, patch } from 'superagent';
import UrlPattern from 'url-pattern';
import partial from 'lodash/function/partial';
import isFunction from 'lodash/lang/isFunction';
import merge from 'lodash/object/merge';
import omit from 'lodash/object/omit';

function resolveParamsAndURI(pathRegexp = '', allParams = {}) {
  if (pathRegexp === '') {
    return { path: pathRegexp, params: allParams };
  }

  const route = new UrlPattern(pathRegexp);
  const path = route.stringify(allParams);
  const params = omit(
    allParams,
    Object.keys(route.match(path))
  );

  return { path, params };
}

function requestFactory(baseUri, headers, fn) {
  const fabricateRequest = (path, callback) => {
    const req = fn(`${baseUri}${path || ''}`);
    Object.keys(headers).forEach(key => req.set(key, headers[key]));

    // TODO: We should return a promise not the callback
    return req.end.bind(req)(callback);
  };

  return path => (params = {}, cb) => {
    const [_params, _cb] = isFunction(params) ?
      [{}, params] :
      [params, cb];

    const {
      params: requestData,
      path: requestUri,
    } = resolveParamsAndURI(path, _params);

    fabricateRequest(requestUri, _cb);
  };
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
