import superagent from 'superagent';
import UrlPattern from 'url-pattern';
import parseUrl from 'url-parse';
import { fromCallback } from 'bluebird';
import partial from 'lodash/function/partial';
import merge from 'lodash/object/merge';
import omit from 'lodash/object/omit';
import compose from 'lodash/function/flow';
import isFunction from 'lodash/lang/isFunction';

function parseRequestData({ path: pathRegexp, params: allParams, headers }) {
  const url = parseUrl(pathRegexp);
  const route = new UrlPattern(url.pathname);

  url.set('pathname', route.stringify(allParams));

  const params = omit(allParams, route.names);

  return {
    params,
    headers,
    path: url.toString(),
  };
}

function requestFactory(baseUri, baseHeaders, optsConfig, method) {
  const {
    postRequest,
    beforeSend,
    parseOpts,
  } = optsConfig;
  const returnFromPostRequest = (r, succeeded = true) => {
    if (!postRequest || !postRequest.length) {
      return r;
    }
    /* eslint-disable no-param-reassign */
    postRequest.forEach(fn => r = fn(r, succeeded));
    /* eslint-enable no-param-reassign */

    return r;
  };

  const resolveRequestData = compose(...beforeSend, parseRequestData);

  return (clientPath, clientHeaders = {}) => (allParams = {}) => {
    function asyncRequest(callback) {
      const fullPath = `${baseUri}${clientPath || ''}`;
      const { params, path, headers } = resolveRequestData({
        path: fullPath,
        params: allParams,
        headers: merge({}, baseHeaders, clientHeaders),
      });

      const req = superagent[method.toLowerCase()](path);

      Object.keys(headers)
        .forEach(key => req.set(key, headers[key]));

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

function resolveOptions(baseOptions = {}, childOptions = {}) {
  let parentBeforeSend,
      parentPostRequest,
      childBeforeSend,
      childPostRequest;

  // Format beforeSend
  if (!baseOptions.beforeSend) {
    parentBeforeSend = [];
  } else if (isFunction(baseOptions.beforeSend)) {
    parentBeforeSend = [baseOptions.beforeSend];
  } else {
    parentBeforeSend = baseOptions.beforeSend;
  }

  if (!childOptions.beforeSend) {
    childBeforeSend = [];
  } else if (isFunction(childOptions.beforeSend)) {
    childBeforeSend = [childOptions.beforeSend];
  } else {
    childBeforeSend = childOptions.beforeSend;
  }

  // Format postRequest
  if (!baseOptions.postRequest) {
    parentPostRequest = [];
  } else if (isFunction(baseOptions.postRequest)) {
    parentPostRequest = [baseOptions.postRequest];
  } else {
    parentPostRequest = baseOptions.postRequest;
  }


  if (!childOptions.postRequest) {
    childPostRequest = [];
  } else if (isFunction(childOptions.postRequest)) {
    childPostRequest = [childOptions.postRequest];
  } else {
    childPostRequest = childOptions.postRequest;
  }

  const postRequest = parentPostRequest.concat(childPostRequest);
  const beforeSend = parentBeforeSend.concat(childBeforeSend);
  return merge({}, baseOptions, childOptions, { postRequest, beforeSend });
}

function factory(baseUri = '', headers = {}, initOpts = {}) {
  const requestor = partial(
    requestFactory,
    baseUri,
    headers,
    resolveOptions(initOpts)
  );

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
