/* eslint-env mocha */

import { expect } from 'chai';
import nock from 'nock';
import async from 'async';
import merge from 'lodash/object/merge';
import sdktor from '../src';

const HOST = 'tests.com';
const ROOT_URI = `https://${HOST}/api/v1/`;
const AUTH = `Basic ${new Buffer('user:pass').toString('base64')}`;
const BASE_HEADERS = {
  accept: 'application/json',
  authorization: AUTH,
  host: 'tests.com',
  'accept-encoding': 'gzip, deflate',
  'user-agent': 'sdktor/1.0',
};

const mockRoot = nock(ROOT_URI);
const sdk = sdktor(ROOT_URI, BASE_HEADERS);

const ensureNoPendingRequests = () => {
  if (!mockRoot.isDone()) {
    throw new Error(`Requests pending: ${mockRoot.pendingMocks()}`);
  }
};

describe('HTTP Verbs', () => {
  before(() => {
    mockRoot
      .get('/service/').reply(200, { payload: 'OK' })
      .post('/service/').reply(201, { name: 'test', ok: true })
      .patch('/service/uuid/').reply(200, { name: 'test2' })
      .put('/service/uuid/').reply(200, { name: 'test2', ok: true })
      .delete('/service/uuid/').reply(200, { name: 'test2', ok: true });
  });

  it('get()', (done) => {
    sdk.get('service/')((err, data) => {
      if (err) return done(err);
      expect(`${ROOT_URI}service/`).to.equal(data.request.url);
      expect(data.body.payload).to.equal('OK');
      done();
    });
  });

  it('post()', (done) => {
    sdk.post('service/')((err, data) => {
      if (err) return done(err);
      expect(`${ROOT_URI}service/`).to.equal(data.request.url);
      expect(data.body.name).to.equal('test');
      expect(data.body.ok).to.equal(true);
      done();
    });
  });

  it('patch()', (done) => {
    sdk.patch('service/uuid/')((err, data) => {
      if (err) return done(err);
      expect(`${ROOT_URI}service/uuid/`).to.equal(data.request.url);
      expect(data.body.name).to.equal('test2');
      done();
    });
  });

  it('put()', (done) => {
    sdk.put('service/uuid/')((err, data) => {
      if (err) return done(err);
      expect(`${ROOT_URI}service/uuid/`).to.equal(data.request.url);
      expect(data.body.name).to.equal('test2');
      done();
    });
  });

  it('del()', (done) => {
    sdk.del('service/uuid/')((err, data) => {
      if (err) return done(err);
      expect(`${ROOT_URI}service/uuid/`).to.equal(data.request.url);
      expect(data.body.name).to.equal('test2');
      expect(data.body.ok).to.equal(true);
      done();
    });
  });

  after(ensureNoPendingRequests);
});

describe('Recursive routes', () => {
  it('at() should allow for nested routes', () => {
    const root = sdk.at('service/');
    const leaf1 = root.at('list/');
    const leaf2 = leaf1.at('item/');
    const leaf3 = leaf2.at('uuid/');
    const leaf3b = leaf2.at('other/');

    [root, leaf1, leaf2, leaf3, leaf3b].forEach((route) => {
      expect(route.at).to.be.a('function');
      expect(route.get).to.be.a('function');
      expect(route.post).to.be.a('function');
      expect(route.patch).to.be.a('function');
      expect(route.put).to.be.a('function');
      expect(route.del).to.be.a('function');
      expect(route.url).to.be.a('function');
    });
    expect(root.url()).to.equal(`${ROOT_URI}service/`);
    expect(leaf1.url()).to.equal(`${ROOT_URI}service/list/`);
    expect(leaf2.url()).to.equal(`${ROOT_URI}service/list/item/`);
    expect(leaf3.url()).to.equal(`${ROOT_URI}service/list/item/uuid/`);
    expect(leaf3b.url()).to.equal(`${ROOT_URI}service/list/item/other/`);
  });

  it('should call the correct endpoint', done => {
    mockRoot
      .get('/service/').reply(200, { ok: 'OK1' })
      .get('/service/item/').reply(200, { ok: 'OK2' })
      .post('/service/item/').reply(200, { ok: 'OK3' })
      .patch('/service/item/').reply(200, { ok: 'OK4' })
      .put('/service/item/').reply(200, { ok: 'OK5' })
      .delete('/service/item/').reply(200, { ok: 'OK6' })
      .get('/service/item/meta/').reply(200, { ok: 'OK7' })
      .get('/service/item/children/').reply(200, { ok: 'OK8' })
      .post('/service/item/children/').reply(200, { ok: 'OK9' })
      .get('/service/item/children/info/').reply(200, { ok: 'OK10' });

    const service = sdk.at('service/');
    const serviceItem = service.at('item/');
    const serviceChildren = serviceItem.at('children/');

    const getServices = service.get();
    const getService = serviceItem.get();
    const createService = serviceItem.post();
    const patchService = serviceItem.patch();
    const updateService = serviceItem.put();
    const deleteService = serviceItem.del();
    const getServiceMeta = serviceItem.get('meta/');
    const getServiceChildren = serviceChildren.get();
    const createServiceChildren = serviceChildren.post();
    const getServiceChildrenInfo = serviceChildren.get('info/');

    const doAssert = (cb, n) => (err, data) => {
      if (err) return cb(err);
      expect(data.status).to.equal(200);
      expect(data.body.ok).to.equal(`OK${n}`);
      cb();
    };

    async.series([
      cb => getServices(doAssert(cb, 1)),
      cb => getService(doAssert(cb, 2)),
      cb => createService(doAssert(cb, 3)),
      cb => patchService(doAssert(cb, 4)),
      cb => updateService(doAssert(cb, 5)),
      cb => deleteService(doAssert(cb, 6)),
      cb => getServiceMeta(doAssert(cb, 7)),
      cb => getServiceChildren(doAssert(cb, 8)),
      cb => createServiceChildren(doAssert(cb, 9)),
      cb => getServiceChildrenInfo(doAssert(cb, 10)),
    ], done);
  });

  after(ensureNoPendingRequests);
});

describe('Parameterization', () => {
  before(() => {
    mockRoot.get('/service/qwerty/').reply(200, { payload: 'OK' });
    mockRoot.post('/service/id_qwerty/v1/extra/').reply(200, { payload: 'OK' });
    mockRoot.post('/service/id_qwerty/v2.5/').reply(200, { payload: 'OK' });
    mockRoot.patch('/service/qwerty/more-data/progfun/').reply(200, { payload: 'OK' });
  });

  it('replace route parameters', (done) => {
    const get = sdk.get('service/:uuid/');
    get({ uuid: 'qwerty' }, (err, data) => {
      expect(`${ROOT_URI}service/qwerty/`).to.equal(data.request.url);
      expect(data.body.payload).to.equal('OK');
      done();
    });
  });

  it('replace route parameters with complex regexp', (done) => {
    const post = sdk.post('service/id_:uuid/v:major(.:minor)/(*/)');
    async.series([
      cb => {
        post({ uuid: 'qwerty', major: 1, _: 'extra' }, (err, data) => {
          expect(`${ROOT_URI}service/id_qwerty/v1/extra/`).to.equal(data.request.url);
          expect(data.body.payload).to.equal('OK');
          cb();
        });
      },
      cb => {
        post({ uuid: 'qwerty', major: 2, minor: 5 }, (err, data) => {
          expect(`${ROOT_URI}service/id_qwerty/v2.5/`).to.equal(data.request.url);
          expect(data.body.payload).to.equal('OK');
          cb();
        });
      },
    ], done);
  });

  it('should throw an error if a required param is not provided', () => {
    const get = sdk.get('service/:uuid/(:type/)');
    expect(() => get(() => {}))
      .to.throw('no values provided for key `uuid`');
    expect(() => get({ type: 'indiferent' }, () => {}))
      .to.throw('no values provided for key `uuid`');
    expect(() => get({ uuid: 'id' }, () => {}))
      .to.not.throw(Error);
  });

  it('should resolve recursive routes params', (done) => {
    const service = sdk.at('service/');
    const item = service.at(':uuid/');
    const patch = item.patch('more-data/:type/');

    patch({ uuid: 'qwerty', type: 'progfun' }, (err, data) => {
      expect(`${ROOT_URI}service/qwerty/more-data/progfun/`).to.equal(data.request.url);
      expect(data.body.payload).to.equal('OK');
      done();
    });
  });

  after(ensureNoPendingRequests);
});

describe('Request Data', () => {
  before(() => {
    mockRoot
      .get('/service/qwerty/')
        .query({ order: 'descending', count: 25, limit: -1 })
        .reply(200, { payload: 'OK' })
      .post('/service/qwerty/', {
        name: 'David Bowie',
        value: 69,
        location: 'Madrid, Spain',
      }).reply(200, { payload: 'OK' })
      .patch('/service/qwerty/', {
        RIP: true,
      }).reply(200, { payload: 'OK' })
      .put('/service/qwerty/', {
        name: 'David Bowie',
        value: 69,
        location: 'Madrid, Spain',
        RIP: true,
      }).reply(200, { payload: 'OK' })
      .delete('/service/qwerty/')
        .reply(204);
  });

  it('get() data should be sent as query string and omit url params', (done) => {
    const get = sdk.get('service/:uuid/');

    get({
      uuid: 'qwerty',
      order: 'descending',
      count: 25,
      limit: -1,
    }, (err, data) => {
      expect(data.body.payload).to.equal('OK');
      done();
    });
  });

  it('post(), path() and put() data should be sent in the body and omit url params', (done) => {
    const post = sdk.post('service/:uuid/');
    const patch = sdk.patch('service/:uuid/');
    const put = sdk.put('service/:uuid/');

    expect(() => patch({ RIP: true }, () => {})).to.throw('no values provided for key `uuid`');

    async.series([
      cb => {
        post({
          uuid: 'qwerty',
          name: 'David Bowie',
          value: 69,
          location: 'Madrid, Spain',
        }, (err, data) => {
          expect(data.body.payload).to.equal('OK');
          cb();
        });
      },
      cb => {
        patch({ RIP: true, uuid: 'qwerty' }, (err, data) => {
          expect(data.body.payload).to.equal('OK');
          cb();
        });
      },
      cb => {
        put({
          uuid: 'qwerty',
          name: 'David Bowie',
          value: 69,
          location: 'Madrid, Spain',
          RIP: true,
        }, (err, data) => {
          expect(data.body.payload).to.equal('OK');
          cb();
        });
      },
    ], done);
  });

  it('delete() should ignore non url params', (done) => {
    const del = sdk.del('service/:uuid/');

    del({ uuid: 'qwerty', invalid: true, more: 'stuff' }, (err, data) => {
      expect(data.status).to.equal(204);
      done();
    });
  });

  after(ensureNoPendingRequests);
});

describe('Headers', () => {
  const headers1 = {
    'cache-control': 'no-cache',
    'accept-language': 'da, en-gb;q=0.8, en;q=0.7',
  };

  const headers2 = {
    'if-match': 'qwerty',
    'max-forwards': 5,
    'user-agent': 'sdktor/2.0',
    'accept-language': 'en, es',
  };

  before(() => {
    mockRoot.get('/service/').reply(204);
    mockRoot.get('/service/').reply(204);
    mockRoot.get('/service/qwerty/meta/').reply(204);
  });

  it('sends the base headers', (done) => {
    const get = sdk.get('service/');
    get((err, data) => {
      expect(data.req.headers).to.eql(BASE_HEADERS);
      expect(data.status).to.equal(204);
      done();
    });
  });

  it('at() accepts extra headers', (done) => {
    const service = sdk.at('service/', headers1);
    const get = service.get();

    get((err, data) => {
      expect(data.req.headers).to.eql(
        merge({}, BASE_HEADERS, headers1)
      );
      done();
    });
  });

  it('recursive routes headers override base headers', (done) => {
    const service = sdk.at('service/:uuid/', headers1);
    const get = service.get('meta/', headers2);

    get({ uuid: 'qwerty' }, (err, data) => {
      expect(data.req.headers).to.eql(
        merge({}, BASE_HEADERS, headers1, headers2)
      );
      done();
    });
  });

  after(ensureNoPendingRequests);
});
