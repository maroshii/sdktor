import superagent from 'superagent';
import UrlPattern from 'url-pattern';
import parseUrl from 'url-parse';
import { fromCallback } from 'bluebird';
import partial from 'lodash/function/partial';
import merge from 'lodash/object/merge';
import omit from 'lodash/object/omit';

function resolveParamsAndURI(pathRegexp, allParams) {
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

function requestFactory(baseUri, baseHeaders, { raw }, method) {
  return (clientPath, clientHeaders = {}) => (allParams = {}) => fromCallback((callback) => {
    const fullPath = `${baseUri}${clientPath || ''}`;
    const { params, path } = resolveParamsAndURI(fullPath, allParams);

    const req = superagent[method.toLowerCase()](path);
    const reqHeaders = merge({}, baseHeaders, clientHeaders);

    Object.keys(reqHeaders)
      .forEach(key => req.set(key, reqHeaders[key]));

    switch (method) {
      case 'DELETE':
        break;
      case 'GET':
        req.query(params);
        break;
      default:
        req.send(params);
    }

    return req.end((err, data) => {
      return callback(err, raw ? data.body : data);
    });
  });
}

function generateAPI(requestor) {
  return {
    get: requestor('GET'),
    post: requestor('POST'),
    put: requestor('PUT'),
    del: requestor('DELETE'),
    patch: requestor('PATCH'),
  };
}

function factory(baseUri = '', headers = {}, initOpts = {}) {
  const requestor = partial(requestFactory, baseUri, headers, initOpts);
  const api = generateAPI(requestor);

  api.at = (path, newHeaders, opts = {}) => {
    return factory(
      baseUri + path,
      merge({}, headers, newHeaders),
      merge({}, initOpts, opts)
    );
  };

  api.url = () => baseUri;

  return api;
}

export default factory;
