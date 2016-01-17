# sdktor

Simple and declarative sdk generator for the browser and nodejs. Uses [superagent](https://github.com/visionmedia/superagent) internally. Written in ES6 but an ES5 built is also provided. It's compatible with browserify and webpack.

## Installation

```
npm install sdktor --save
```

## Usage

Supports all major HTTP verbs: __GET__ __POST__ __PATH__ __PUT__ __DELETE__.

```javascript

const sdktor = require('sdktor');

// Create the SDK with configuration
// that will be passed on to all requests
const sdk = sdktor('https://api.github.com', {
  Accept: 'application/vnd.github.v3+json',
  Authorization: 'token <OAUTH-TOKEN>'
});

// Define endpoints
const getPublicGists = sdk.get('/gists/private');
const getPrivateGists = sdk.get('/gists/public');

const now = new Date().toString();
const log = (err,resp) => {
  console.log(resp.body);
};

getPublicGists(log);
getPublicGists({since: now},log);
//
getPrivateGists(log);
getPrivateGists({since: now },log);

```

Routes can be defined recursively with the `at()` method. Regular expressions are supported as well.

All params that are not route params will be passed as query string for get requests and in the body for all other methods.

Paths are parsed using the [url-pattern](https://github.com/snd/url-pattern) library. Allowing for very flexible route definitions:

```javascript
const sdktor = require('sdktor');
const sdk = sdktor('https://api.com/');
const containersSdk = sdk.at('v:major(.:minor)/containers/');

const { get, post, path, put, del } = containersSdk.at(':id/');

const getOne = get('', {'cache-control': 'no-cache'}); 
const getMeta = get('meta/');
const create = containersSdk.post();
const update = put();
const patch  = patch();
const remove = del();

// GET https://api.com/v1/containers/2/?source=newsletter
// with no-cache header
get({ major: 1, id: 2, source: 'newsletter' }, (err, data) => {}); 

// GET https://api.com/v1.2/containers/3/meta/?order=ascending&all=1
getMeta({ major: 1, id: 3 order: 'ascending', all: 1 }, (err, data) => {});

// POST https://api.com/v2.0-rc1/containers/4/ {name: 'nginx'}
create({ major: 2, id: 4, minor: '0-rc1', name: 'nginx'}, (err, data) => {});

// throws, as major and id are required
path({ name: 'nginx'}, (err, data) => {}); 



```

Note: Only the pathname is parsed, the protocol is left as is.

## API

##### sdktor(URI,HEADERS) => sdk

This is the base function. All subsequent methods will extend HEADERS and append to URI

##### sdk.at(path,HEADERS) => caller

Calls sdktor() resursively. All subsequent calls wil be relative to this path.

##### sdk.get(path,HEADERS) => caller

Sets up a get handler extending the path and headers from th current cursor location

##### sdk.post(path,HEADERS) => caller

Sets up a post handler extending the path and headers from th current cursor location

##### sdk.patch(path,HEADERS) => caller

Sets up a patch handler extending the path and headers from th current cursor location

##### sdk.put(path,HEADERS) => caller

Sets up a put handler extending the path and headers from th current cursor location

##### sdk.del(path,HEADERS) => caller

Sets up a delete handler extending the path and headers from th current cursor location

##### caller([params],callback => (err, response)) => null

Makes the call to the preconfigured path with all headers. If regular expression where used omits the url params from the data that will be sent in the request. DELETE requests omit all body and/or query string data.

Note:  All methods can be called any number of times with no side effects.

## License

The MIT License (MIT)
Copyright (c) 2016 Francisco Miranda

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
