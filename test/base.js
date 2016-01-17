/* eslint-env mocha */

import { expect } from 'chai';
import nock from 'nock';
import async from 'async';
import sdktor from '../src';

const HOST = 'tests.com';
const ROOT_URI = `https://${HOST}/api/v1/`;
const AUTH = `Basic ${new Buffer('user:pass').toString('base64')}`;

const mockRoot = nock(ROOT_URI);
const sdk = sdktor(ROOT_URI, {
  Accept: 'application/json',
  Authorization: AUTH,
  Host: HOST,
});

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
