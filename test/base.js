/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

import { expect } from 'chai';
import sdker from '../src';

const AUTH = `Basic ${new Buffer('maroshii:2e024c866f8e9bbbee78cb6957cbf85c752d64c7639ea51b').toString('base64')}`;
const sdk = sdker('https://dashboard.tutum.co/api/v1', {
  Accept: 'application/json',
  Authorization: AUTH,
  Host: 'dashboard.tutum.co',
});

describe('Requests', () => {
  describe('default', () => {
    it('defaults to GET', (done) => {
      const getter = sdk('/service');
      getter(function(err, data) {
        console.log(data.body.meta);
        done();
      });
    });
  });
});
/* eslint-enable no-unused-expressions */
