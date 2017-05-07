/**
 * plugin
 */

'use strict';

/* Node modules */

/* Third-party modules */
const Plugin = require('steeplejack/lib/plugin');

/* Files */
const strategy = require('./strategy');

module.exports = new Plugin([
  strategy,
]);
