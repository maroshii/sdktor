import { get, post, patch, del } from 'superagent';
import each from 'lodash/collection/each';

export default function factory(baseUri, headers){
  return (subpath) => {
    const getter = get(`${baseUri}${subpath}`);
    each(headers, (val, key) => getter.set(key, val));
    return getter.end.bind(getter);
  }
}

