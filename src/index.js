import { get, post, put, del, patch } from 'superagent';
import partial from 'lodash/function/partial';

function requestFactory (baseUri, headers, fn) {
  return path => {
    const req = fn(`${baseUri}${path}`);
    Object.keys(headers).forEach(key => req.set(key, headers[key]));
    return req.end.bind(req);  
  }
}

function factory(baseUri, headers){
  const requestor = partial(requestFactory,baseUri,headers);

  // Not doing api = getFn
  // to avoid circular references
  const api = (...args) => requestor(get)(...args);

  api.get = requestor(get);
  api.post = requestor(post);
  api.put = requestor(put);
  api.del = requestor(del);
  api.patch = requestor(patch);

  return api;
}

export default factory;