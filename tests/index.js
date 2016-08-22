const assert = require('chai').assert;
const expect = require('chai').expect;
const axios = require('axios');
const request = require('supertest');
const server = require('./testServer');

const User = require('../src/server/models/User');

let currentListeningServer;
let PORT = 8080;

let testUserId;
let testCount;

describe('API server', function () {
  this.timeout(15000);
  before(function () {
    currentListeningServer = server.default.listen(PORT);
  });

  after(function () {
    currentListeningServer.close();
  });

  describe('Check basic build', function () {
    it('should return 200', function (done) {
      axios.get(`http://localhost:${PORT}/`)
      .then((res) => {
        assert.equal(res.status, 200, 'did not return 200', res.status);
        done();
      });
    });

    describe('Check restful routes', function () {

      it('should get all users when presented with the API access token', function (done) {
        axios.get(`http://localhost:${PORT}/dev/users`, {
          headers: {'x-access-token': process.env.CARVIS_API_KEY}
        })
        .then((res) => {
          testCount = res.data.length;
          assert.equal(res.status, 200, 'did not return 200', res.status);
          done();
        })
        .catch((err) => done(err));
      });

      it('should allow a developer to add a user when presented with the right access token', function (done) {
        axios.post(`http://localhost:${PORT}/dev/users`, {email: `test${testCount}`, password: 'test', lyftToken: '23jlkjd39'}, {
          headers: {'x-access-token': process.env.CARVIS_API_KEY }
        })
        .then((res) => {
          testUserId = res.data[0].id;
          assert.equal(res.status, 200, 'did not return 200', res.status);
          done();
        })
        .catch((err) => done(err));
      });

      it('return the correct data for users posted to the DB', function (done) {
        axios.get(`http://localhost:${PORT}/users/${testUserId}`, {
          headers: {'x-access-token': process.env.CARVIS_API_KEY }
        })
        .then((res) => {
          expect(res.status).to.equal(200);
          expect('test').to.equal(res.data[0].password);
          expect('23jlkjd39').to.equal(res.data[0].lyftToken);
          done();
        })
        .catch((err) => done(err));
      });

      it('should allow users to update their information', function (done) {
        axios.put(`http://localhost:${PORT}/users/${testUserId}`, {email: 'test${testUserId}second@gmail.com', password: 'newtest'},
        { headers: {'x-access-token': process.env.CARVIS_API_KEY }
        })
        .then((res) => {
          assert.equal(res.status, 200, 'did not return 200', res.status);
          done();
        })
        .catch((err) => done(err));
      });


      it('should delete the user created by the developer', function (done) {
        axios.delete(`http://localhost:${PORT}/dev/users/${testUserId}`, {
          headers: {'x-access-token': process.env.CARVIS_API_KEY }
        })
        .then((res) => {
          assert.equal(res.status, 200, 'did not return 200', res.status);
          done();
        });
      });

      it('should properly update or create', function (done) {
        axios.post(`http://localhost:${PORT}/users/updateOrCreate`, {email: 'newuser@gmial.com', password: 'yo', lyftToken: 'yellow'}, {
          headers: {'x-access-token': process.env.CARVIS_API_KEY }
        })
        .then((res) => {
          assert.equal(res.status, 200, 'did not return 200', res.status);
          expect(res.data.lyftToken).to.equal('yellow');
          return axios.post(`http://localhost:${PORT}/users/updateOrCreate`, {email: 'newuser@gmial.com', password: 'yo', lyftToken: 'blue'}, {
            headers: {'x-access-token': process.env.CARVIS_API_KEY }
          });
        })
        .then((res) => {
          expect(res.data.lyftToken).to.equal('blue');
          // expect().to.equal('yo');
          done();
        })
        .catch((err) => done(err));
      });

      it('should return the correct data for an Alexa launch intent request', function (done) {
        axios.post(`http://localhost:${PORT}/alexa/launch`,
        { headers: { 'Content-Type': 'application/json' }
        })
        .then((res) => {
          assert.equal(res.status, 200, 'did not return 200', res.status);
          expect(res.data.prompt).to.exist;
          done();
        })
        .catch((err) => done(err));
      });

      it('should return the correct data for an Alexa estimate intent request', function (done) {
        let body = {data: { request: {intent: {slots: {DESTINATION: {value: 'hack reactor' }, MODE: {value: 'cheapest' }}}}}};
        axios.post(`http://localhost:${PORT}/alexa/estimate`, body,
        { headers: { 'Content-Type': 'application/json' }
        })
        .then((res) => {
          assert.equal(res.status, 200, 'did not return 200', res.status);
          expect(res.data.prompt).to.exist;
          done();
        })
        .catch((err) => done(err));
      });

      it('should handle an Alexa estimate intent request for an unrecognized location', function (done) {
        let body = {data: { request: {intent: {slots: {DESTINATION: {value: 'ass FO airport' }, MODE: {value: 'cheapest' }}}}}};
        axios.post(`http://localhost:${PORT}/alexa/estimate`, body,
        { headers: { 'Content-Type': 'application/json' }
        })
        .then((res) => {
          assert.equal(res.status, 200, 'did not return 200', res.status);
          expect(res.data.prompt).to.exist;
          done();
        })
        .catch((err) => done(err));
      });

      it('should handle an Alexa estimate intent request that returns no valid estimates', function (done) {
        let body = {data: { request: {intent: {slots: {DESTINATION: {value: 'antarctica' }, MODE: {value: 'cheapest' }}}}}};
        axios.post(`http://localhost:${PORT}/alexa/estimate`, body,
        { headers: { 'Content-Type': 'application/json' }
        })
        .then((res) => {
          assert.equal(res.status, 200, 'did not return 200', res.status);
          expect(res.data.prompt).to.exist;
          done();
        })
        .catch((err) => done(err));
      });

      
    });
  });
});
