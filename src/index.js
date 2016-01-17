import { get, post, put, del, patch } from 'superagent';
import UrlPattern from 'url-pattern';
import parseUrl from 'url-parse';
import partial from 'lodash/function/partial';
import isFunction from 'lodash/lang/isFunction';
import merge from 'lodash/object/merge';
import omit from 'lodash/object/omit';

function resolveParamsAndURI(pathRegexp = '', allParams = {}) {
  if (!pathRegexp) {
    return { path: pathRegexp, params: allParams };
  }

  const url = parseUrl(pathRegexp);
  const route = new UrlPattern(url.pathname);

  url.set('pathname', route.stringify(allParams));

  const params = omit(
    allParams,
    Object.keys(route.match(url.pathname))
  );

  return {
    params,
    path: url.toString(),
  };
}

function requestFactory(baseUri = '', baseHeaders = {}, fn) {
  return (clientPath, clientHeaders = {}) => (clientParams = {}, clientCallback) => {
    const fullPath = `${baseUri}${clientPath || ''}`;
    const [allParams, callback] = isFunction(clientParams) ?
      [{}, clientParams] :
      [clientParams, clientCallback];

    const { params, path } = resolveParamsAndURI(fullPath, allParams);

    const req = fn(path);
    const reqHeaders = merge({}, baseHeaders, clientHeaders);

    Object.keys(reqHeaders).forEach(key => req.set(key, reqHeaders[key]));

    // TODO: We should return a promise not the callback
    return req.end.bind(req)(callback);
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
