/**
 * index
 */

'use strict';

/* Node modules */
const EventEmitter = require('events').EventEmitter;

/* Third-party modules */
const express = require('express');

/* Files */
const setup = require('../helpers/setup');
const strategy = require('../../src/strategy');

const expect = setup.expect;
const proxyquire = setup.proxyquire;
const sinon = setup.sinon;

const Original = strategy.default().Express;
const expressLib = strategy.default().expressLib;

describe('index test', function () {
  let Express;
  let exp;
  let https;
  beforeEach(function () {
    exp = sinon.stub();
    https = {
      createServer: sinon.stub(),
    };

    const obj = proxyquire('../../src/strategy', {
      express: exp,
      https,
    });

    expect(obj).to.have.keys([
      'default',
      'inject',
    ]);

    expect(obj.inject).to.be.eql({
      name: 'steeplejack-express',
    });

    expect(obj.default).to.be.a('function');

    expect(obj.default().expressLib).to.be.equal(exp);

    Express = obj.default().Express;

    expect(expressLib).to.be.equal(express);
  });

  describe('methods', function () {
    describe('#constructor', function () {
      it('should create the express instance with default options', function () {
        exp.returns('express');

        const obj = new Express();

        expect(obj).to.be.instanceof(Express)
          .instanceof(EventEmitter);

        expect(exp).to.be.calledOnce
          .calledWithExactly();

        expect(obj.inst).to.be.equal('express');

        expect(obj.opts).to.be.eql({});
      });

      it('should create the express instance with some options', function () {
        exp.returns('express');

        const obj = new Express({
          ssl: {
            key: '1234',
          },
        });

        expect(obj).to.be.instanceof(Express)
          .instanceof(EventEmitter);

        expect(exp).to.be.calledOnce
          .calledWithExactly();

        expect(obj.inst).to.be.equal('express');

        expect(obj.opts).to.be.eql({
          ssl: {
            key: '1234',
          },
        });
      });
    });

    describe('#addRoute', function () {
      beforeEach(function () {
        this.req = sinon.spy();
        this.res = sinon.spy();
        this.next = sinon.spy();

        this.obj = new Express();

        this.server = {};

        this.outputHandler = sinon.spy(this.obj, 'outputHandler');
      });

      it('should handle a successful iteration', function (done) {
        const iterator = (req, res) => {
          expect(req).to.be.equal(this.req);
          expect(res).to.be.equal(this.res);

          return Promise.resolve('my result');
        };

        this.server.get = (route, fn) => {
          expect(route).to.be.equal('/path/to/route');

          fn(this.req, this.res, this.next)
            .then((result) => {
              expect(result).to.be.equal('my result');

              expect(this.next).to.not.be.called;

              done();
            });
        };

        this.stub = sinon.stub(this.obj, 'getServer')
          .returns(this.server);

        expect(this.obj.addRoute('GeT', '/path/to/route', iterator)).to.be.undefined;
      });

      it('should handle an error in the iteration', function (done) {
        const iterator = (req, res) => {
          expect(req).to.be.equal(this.req);
          expect(res).to.be.equal(this.res);

          return Promise.reject('my error');
        };

        this.server.post = (route, fn) => {
          expect(route).to.be.equal('/path/to/other/route');

          fn(this.req, this.res, this.next)
            .then(() => {
              throw new Error('invalid');
            })
            .catch((err) => {
              expect(err).to.be.equal('my error');

              expect(this.next).to.be.calledOnce
                .calledWithExactly('my error');

              done();
            });
        };

        this.stub = sinon.stub(this.obj, 'getServer')
          .returns(this.server);

        expect(this.obj.addRoute('POST', '/path/to/other/route', iterator)).to.be.undefined;
      });
    });

    describe('#close', function () {
      it('should call the listener close method', function () {
        const obj = new Express();

        obj.listener = {
          close: sinon.spy(),
        };

        expect(obj.close()).to.be.equal(obj);

        expect(obj.listener.close).to.be.calledOnce
          .calledWithExactly();
      });
    });

    describe('#getRawServer', function () {
      it('should return the instance', function () {
        const obj = new Express();

        obj.inst = 'some instance';

        expect(obj.getRawServer()).to.be.equal('some instance');
      });
    });

    describe('#getServer', function () {
      it('should return the instance', function () {
        const obj = new Express();

        obj.inst = 'some instance';

        expect(obj.getServer()).to.be.equal('some instance');
      });
    });

    describe('#outputHandler', function () {
      let req;
      let res;
      let obj;
      beforeEach(function () {
        req = {};
        res = {
          format: sinon.stub(),
          headersSent: false,
          json: sinon.stub(),
          render: sinon.stub(),
          send: sinon.stub(),
          set: sinon.spy(),
          status: sinon.spy(),
        };

        obj = new Original();
      });

      it('should do nothing if the headers are already sent', function () {
        res.headersSent = true;

        expect(obj.outputHandler(200, {}, req, res)).to.be.undefined;

        expect(res.status).to.not.be.called;

        expect(res.send).to.not.be.called;
      });

      it('should call the response with the data and statusCode', function () {
        const data = {
          hello: 'world',
        };

        res.send.returns('result');

        expect(obj.outputHandler(201, data, req, res)).to.be.equal('result');

        expect(res.status).to.be.calledOnce
          .calledWithExactly(201);

        expect(res.send).to.be.calledOnce
          .calledWithExactly(data);
      });

      it('should render the output if a View sent and not change status code', function (done) {
        const data = {
          getHeaders: sinon.stub()
            .returns('some header'),
          getStatusCode: sinon.stub()
            .returns(null),
          getRenderData: sinon.stub()
            .returns({
              some: 'data',
            }),
          getRenderTemplate: sinon.stub()
            .returns('/path/to/template'),
        };

        res.format = (obj1) => {
          expect(obj1).to.have.keys([
            'json',
            'html',
          ]);

          /* Ensure HTML is first so it defaults output to HTML if not accepts sent */
          expect(Object.keys(obj1)).to.be.eql([
            'html',
            'json',
          ]);

          expect(obj1.json()).to.be.equal('jsonOutput');
          expect(obj1.html()).to.be.equal('renderOutput');

          expect(data.getRenderData).to.be.calledTwice
            .calledWithExactly();

          expect(data.getRenderTemplate).to.be.calledOnce
            .calledWithExactly();

          expect(res.json).to.be.calledOnce
            .calledWithExactly({
              some: 'data',
            });

          expect(res.render).to.be.calledOnce
            .calledWithExactly('/path/to/template', {
              some: 'data',
            });

          setTimeout(done, 10);

          return 'formattedText';
        };
        res.json.returns('jsonOutput');
        res.render.returns('renderOutput');

        expect(obj.outputHandler(204, data, req, res)).to.be.equal('formattedText');

        expect(data.getStatusCode).to.be.calledOnce
          .calledWithExactly();

        expect(res.status).to.be.calledOnce
          .calledWithExactly(204);

        expect(res.set).to.be.calledOnce
          .calledWithExactly('some header');

        expect(data.getHeaders).to.be.calledOnce
          .calledWithExactly();
      });

      it('should render the output if a View sent and change status code', function (done) {
        const data = {
          getHeaders: sinon.stub()
            .returns('some header'),
          getStatusCode: sinon.stub()
            .returns(503),
          getRenderData: sinon.stub()
            .returns({
              some: 'data',
            }),
          getRenderTemplate: sinon.stub()
            .returns('/path/to/template'),
        };

        res.format = (obj1) => {
          expect(obj1).to.have.keys([
            'json',
            'html',
          ]);

          expect(obj1.json()).to.be.equal('jsonOutput');
          expect(obj1.html()).to.be.equal('renderOutput');

          expect(data.getRenderData).to.be.calledTwice
            .calledWithExactly();

          expect(data.getRenderTemplate).to.be.calledOnce
            .calledWithExactly();

          expect(res.json).to.be.calledOnce
            .calledWithExactly({
              some: 'data',
            });

          expect(res.render).to.be.calledOnce
            .calledWithExactly('/path/to/template', {
              some: 'data',
            });

          setTimeout(done, 10);

          return 'formattedText';
        };
        res.json.returns('jsonOutput');
        res.render.returns('renderOutput');

        expect(obj.outputHandler(200, data, req, res)).to.be.equal('formattedText');

        expect(data.getStatusCode).to.be.calledOnce
          .calledWithExactly();

        expect(res.status).to.be.calledTwice
          .calledWithExactly(200)
          .calledWithExactly(503);

        expect(res.set).to.be.calledOnce
          .calledWithExactly('some header');

        expect(data.getHeaders).to.be.calledOnce
          .calledWithExactly();
      });
    });

    describe('#set', function () {
      it('should wrap the set method and return this', function () {
        const obj = new Express();

        obj.inst = {
          set: sinon.spy(),
        };

        expect(obj.set('param1', 'param2', 'param3')).to.be.equal(obj);

        expect(obj.inst.set).to.be.calledOnce
          .calledWithExactly('param1', 'param2', 'param3');
      });
    });

    describe('#start', function () {
      it('should start the server successfully', function () {
        const obj = new Express();

        const listen = sinon.stub()
          .yields(null, 'result');

        const stub = sinon.stub(obj, 'getServer')
          .returns({
            listen,
          });

        return obj.start(8080, 'hostname', 12345)
          .then((res) => {
            expect(res).to.be.equal('result');

            expect(stub).to.be.calledOnce
              .calledWithExactly();

            expect(listen).to.be.calledOnce
              .calledWith(8080, 'hostname', 12345);
          });
      });

      it('should start an SSL server', function () {
        const obj = new Express({
          ssl: {
            key: '12345',
          },
        });

        const listen = sinon.stub()
          .returns('listenRef')
          .yields(null, 'result');

        const stub = sinon.stub(obj, 'getServer')
          .returns('inst');

        https.createServer
          .returns({
            listen,
          });

        return obj.start(8080, 'hostname', 12345)
          .then((res) => {
            expect(res).to.be.equal('result');

            expect(https.createServer).to.be.calledOnce
              .calledWithExactly({
                key: '12345',
              }, 'inst');

            expect(listen).to.be.calledOnce
              .calledWith(8080, 'hostname', 12345);

            expect(stub).to.be.calledOnce
              .calledWithExactly();
          });
      });

      it('should fail to start the server', function () {
        const obj = new Express();

        const listen = sinon.stub()
          .yields('err');

        const stub = sinon.stub(obj, 'getServer')
          .returns({
            listen,
          });

        return obj.start(9999, 'address', 512)
          .then(() => {
            throw new Error('uh-oh');
          })
          .catch((err) => {
            expect(err).to.be.equal('err');

            expect(stub).to.be.calledOnce
              .calledWithExactly();

            expect(listen).to.be.calledOnce
              .calledWith(9999, 'address', 512);
          });
      });
    });

    describe('#uncaughtException', function () {
      it('should add listener to the uncaughtException event', function (done) {
        const obj = new Express();

        const use = sinon.stub()
          .yields('err', 'req', 'res', 'next');

        const stub = sinon.stub(obj, 'getServer')
          .returns({
            use,
          });

        const fn = (req, res, err, ...args) => {
          expect(err).to.be.equal('err');
          expect(req).to.be.equal('req');
          expect(res).to.be.equal('res');
          expect(args).to.be.eql([
            'next',
          ]);

          done();
        };

        expect(obj.uncaughtException(fn)).to.be.equal(obj);

        expect(stub).to.be.calledOnce;
      });
    });

    describe('#use', function () {
      it('should use the use method', function () {
        const obj = new Express();

        const fn = () => {};

        const spy = sinon.spy();

        const stub = sinon.stub(obj, 'getServer').returns({
          use: spy,
        });

        expect(obj.use(fn)).to.be.equal(obj);

        expect(stub).to.be.calledOnce
          .calledWithExactly();

        expect(spy).to.be.calledOnce
          .calledWithExactly(fn);
      });
    });
  });
});
