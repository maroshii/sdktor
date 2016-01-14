/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

import { expect } from 'chai';
import sdktor from '../src';

const ROOT_URI = 'https://dashboard.tutum.co/api/v1/';
const AUTH = `Basic ${new Buffer('maroshii:2e024c866f8e9bbbee78cb6957cbf85c752d64c7639ea51b').toString('base64')}`;
const sdk = sdktor(ROOT_URI, {
  Accept: 'application/json',
  Authorization: AUTH,
  Host: 'dashboard.tutum.co',
});

const assertCollection = ({ body }) => {
  expect(body).to.be.an('object');
  expect(body.meta).to.be.an('object');
  expect(body.objects).to.be.an('array');
}


describe('Requests', () => {
  describe('Basic HTTP Methods', () => {
    it('defaults to GET', (done) => {
      const get = sdk('service/');
      get(function(err, data) {
        if(err) return done(err);
        assertCollection(data);
        done();
      });
    });
    it('get()', (done) => {
      const get = sdk.get('service/');
      get(function(err, data) {
        if(err) return done(err);
        assertCollection(data);
        done();
      });
    });
    it('post()', (done) => {
      const post = sdk.post('service/');
      post(function(err, data) {
        expect(err.message).to.equal('Bad Request');
        expect(err.status).to.equal(400);
        done();
      });
    });
    it('patch()', (done) => {
      const post = sdk.patch('service/');
      post(function(err, data) {
        expect(err.message).to.equal('Method Not Allowed');
        expect(err.status).to.equal(405);
        done();
      });
    });
    it('put()', (done) => {
      const post = sdk.put('service/');
      post(function(err, data) {
        expect(err.message).to.equal('Method Not Allowed');
        expect(err.status).to.equal(405);
        done();
      });
    });
    it('del()', (done) => {
      const post = sdk.del('service/');
      post(function(err, data) {
        expect(err.message).to.equal('Method Not Allowed');
        expect(err.status).to.equal(405);
        done();
      });
    });
  });
  
  describe.only('Recursive routes', () => {
    it('at() should allow for nested routes',() => {
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
      expect(root.url()).to.equal(ROOT_URI + 'service/');
      expect(leaf1.url()).to.equal(ROOT_URI + 'service/list/');
      expect(leaf2.url()).to.equal(ROOT_URI + 'service/list/item/');
      expect(leaf3.url()).to.equal(ROOT_URI + 'service/list/item/uuid/');
      expect(leaf3b.url()).to.equal(ROOT_URI + 'service/list/item/other/');
    });
  });
});
/* eslint-enable no-unused-expressions */
