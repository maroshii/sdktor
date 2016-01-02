/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

import { expect } from 'chai';
import sdktor from '../src';

const AUTH = `Basic ${new Buffer('maroshii:2e024c866f8e9bbbee78cb6957cbf85c752d64c7639ea51b').toString('base64')}`;
const sdk = sdktor('https://dashboard.tutum.co/api/v1', {
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
      const get = sdk('/service/');
      get(function(err, data) {
        if(err) return done(err);
        assertCollection(data);
        done();
      });
    });
    it('get()', (done) => {
      const get = sdk.get('/service/');
      get(function(err, data) {
        if(err) return done(err);
        assertCollection(data);
        done();
      });
    });
    it('post()', (done) => {
      const post = sdk.post('/service/');
      post(function(err, data) {
        expect(err.message).to.equal('Bad Request');
        expect(err.status).to.equal(400);
        done();
      });
    });
    it('patch()', (done) => {
      const post = sdk.patch('/service/');
      post(function(err, data) {
        expect(err.message).to.equal('Method Not Allowed');
        expect(err.status).to.equal(405);
        done();
      });
    });
    it('put()', (done) => {
      const post = sdk.put('/service/');
      post(function(err, data) {
        expect(err.message).to.equal('Method Not Allowed');
        expect(err.status).to.equal(405);
        done();
      });
    });
    it('del()', (done) => {
      const post = sdk.del('/service/');
      post(function(err, data) {
        expect(err.message).to.equal('Method Not Allowed');
        expect(err.status).to.equal(405);
        done();
      });
    });

  });
});
/* eslint-enable no-unused-expressions */
