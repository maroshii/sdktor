# sdktor

Simple and declarative sdk generator for the browser and nodejs. Uses [superagent](https://github.com/visionmedia/superagent) internally to make requests. Written in ES6 but an ES5 built is also provided. It's compatible with browserify and webpack.

## Installation

```
npm install sdktor
```


## Usage

All major HTTP verbs are supported: __GET__ __POST__ __PATH__ __PUT__ __DELETE__.

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

getPublicGists((err,response) => {
  
});
getPublicGists({since: now}(err,response) => {
  
});

getPrivateGists((err,response) => {
  
});

getPrivateGists({since: now },(err,response) => {
  
});

```

Routes can be defined recursively and with params. All params that are not route params will be passed used as query string for get requests and in the body for all other methods.

```javascript
const sdktor = require('sdktor');

const sdk = sdktor('https://api.github.com', {
  Accept: 'application/vnd.github.v3+json',
  Authorization: 'token <OAUTH-TOKEN>'
});

const gitData = sdk.at('/repos/:owner/:repo/git');

const getACommit = gitData.get('/commits/:sha');
const createACommit = gitData.post('/commits');

getACommit({owner: 'me', repo: 'sdktor', sha: '1acc'},(err, response) => {
  console.log(response.body.sha);
});

createACommit({
  owner: 'me',
  repo: 'sdktor',
  message: 'This is my commit. There many like it but this one is mine',
  tree: '6912',
  parents: '7638'
},(err, response) => {
  console.log(response.body.sha);
})

```

## API

### sdktor(<URI>,<HEADERS>) => sdk
### sdk.get(path,<HEADERS>) => caller
### sdk.post(path,<HEADERS>) => caller
### sdk.patch(path,<HEADERS>) => caller
### sdk.put(path,<HEADERS>) => caller
### sdk.delete(path,<HEADERS>) => caller
### caller([params],callback => (err, response)) => null

## License

The MIT License (MIT)
Copyright (c) 2016 Francisco Miranda

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
