/**
 * plugin.test
 */

'use strict';

/* Node modules */

/* Third-party modules */
const Plugin = require('steeplejack/lib/plugin');

/* Files */
const setup = require('../helpers/setup');
const plugin = require('../..');
const strategy = require('../../src/strategy');

const expect = setup.expect;
const proxyquire = setup.proxyquire;
const sinon = setup.sinon;

describe('Plugin tests', function () {
  beforeEach(function () {
    this.pluginInst = {
      hello: 'world',
    };

    this.Plugin = sinon.stub().returns(this.pluginInst);

    this.obj = proxyquire('../../src/plugin', {
      'steeplejack/lib/plugin': this.Plugin,
    });

    expect(plugin).to.be.instanceof(Plugin);
  });

  it('should define the plugin', function () {
    expect(this.obj).to.be.equal(this.pluginInst);

    expect(this.Plugin).to.be.calledOnce
      .calledWithNew
      .calledWithExactly([
        strategy,
      ]);
  });
});
