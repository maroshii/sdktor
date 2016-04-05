import superagent from 'superagent';
import UrlPattern from 'url-pattern';
import parseUrl from 'url-parse';
import { fromCallback } from 'bluebird';
import partial from 'lodash/function/partial';
import merge from 'lodash/object/merge';
import omit from 'lodash/object/omit';

function resolveParamsAndURI(pathRegexp, allParams, parseOpts) {
  const url = parseUrl(pathRegexp);
  const route = new UrlPattern(url.pathname, parseOpts);

  url.set('pathname', route.stringify(allParams));

  const params = omit(allParams, route.names);

  return {
    params,
    path: url.toString(),
  };
}

function requestFactory(baseUri, baseHeaders, optsConfig, method) {
  const { postRequest, parseOpts } = optsConfig;
  const returnFromPostRequest = (r, succeeded = true) => {
    if (!postRequest || !postRequest.length) {
      return r;
    }

    /* eslint-disable no-param-reassign */
    postRequest.forEach(fn => r = fn(r, succeeded));
    /* eslint-enable no-param-reassign */

    return r;
  };

  return (clientPath, clientHeaders = {}) => (allParams = {}) => {
    function asyncRequest(callback) {
      const fullPath = `${baseUri}${clientPath || ''}`;
      const { params, path } = resolveParamsAndURI(
        fullPath,
        allParams,
        parseOpts
    );

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

      return req.end.bind(req)(callback);
    }

    return fromCallback(asyncRequest)
      .catch((error) => {
        // Allow the client to throw first if it's an API error
        if (error.response) {
          returnFromPostRequest(error.response, false);
        }

        throw error;
      })
      .then(returnFromPostRequest);
  };
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

function resolveOptions(baseOptions, childOptions) {
  const { postRequest: parentPostRequest = [] } = baseOptions;
  const { postRequest: childPostRequest = [] } = childOptions;
  const postRequest = parentPostRequest.concat(childPostRequest);

  return merge({}, baseOptions, childOptions, { postRequest });
}

function factory(baseUri = '', headers = {}, initOpts = {}) {
  const requestor = partial(requestFactory, baseUri, headers, initOpts);

  const api = generateAPI(requestor);

  api.at = (path, newHeaders, opts = {}) => {
    return factory(
      baseUri + path,
      merge({}, headers, newHeaders),
      resolveOptions(initOpts, opts)
    );
  };

  api.url = () => baseUri;

  return api;
}

export default factory;
