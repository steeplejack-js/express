/**
 * index
 */

/* Node modules */
const EventEmitter = require('events').EventEmitter;
const https = require('https');

/* Third-party modules */
const _ = require('lodash');
const expressLib = require('express');

/* Files */

class Express extends EventEmitter {
  constructor (opts = {}) {
    super();

    this.inst = expressLib();
    this.listener = null;
    this.opts = opts;
  }

  /**
   * Add Route
   *
   * Adds a new route to listen for on the server
   *
   * @param httpMethod
   * @param route
   * @param iterator
   */
  addRoute (httpMethod, route, iterator) {
    /* Express requires in lower case */
    const method = httpMethod.toLowerCase();

    this.getServer()[method](route, (req, res, next) => iterator(req, res)
      .catch((err) => {
        next(err);
        throw err;
      }));
  }

  /**
   * Close
   *
   * Stops the server from accepting incoming
   * connections
   *
   * @returns {Express}
   */
  close () {
    this.listener.close();

    return this;
  }

  /**
   * Get Raw Server
   *
   * Same as getServer
   *
   * @returns {*}
   */
  getRawServer () {
    return this.getServer();
  }

  /**
   * Get Server
   *
   * Gets the instance of the Express server
   *
   * @returns {*|Function}
   */
  getServer () {
    return this.inst;
  }

  /**
   * Output Handler
   *
   * This handles the output. This can be activated
   * directly or bundled up into a closure and passed
   * around.
   *
   * @param {number} statusCode
   * @param {*} output
   * @param {*} request
   * @param {*} response
   */
  outputHandler (statusCode, output, request, response) {
    if (response.headersSent === false) {
      /* Set the status */
      response.status(statusCode);

      try {
        /* Look for rendered output - first, see if status code is changed */
        const renderStatusCode = output.getStatusCode();
        if (renderStatusCode !== null) {
          response.status(renderStatusCode);
        }

        /* Set any headers */
        response.set(output.getHeaders());

        /* Do the output */
        const format = {
          html: () => response.render(output.getRenderTemplate(), output.getRenderData()),
          json: () => response.json(output.getRenderData()),
        };

        return response.format(format);
      } catch (err) {
        /* Just send output as is */
        return response.send(output);
      }
    }

    return undefined;
  }

  /**
   * Set
   *
   * Wraps the set method
   *
   * @param {*[]} arguments
   * @returns {Express}
   */
  set () {
    const server = this.getServer();

    server.set(...arguments);

    return this;
  }

  /**
   * Start
   *
   * Starts the Express server. Wraps the
   * NodeJS HTTP.listen method. If there are
   * any SSL options set, it uses the HTTPS
   * library instead of the HTTP one.
   *
   * @param {number} port
   * @param {string} hostname
   * @param {number} backlog
   * @returns {Promise}
   */
  start (port, hostname, backlog) {
    return new Promise((resolve, reject) => {
      let factory;

      if (_.isEmpty(this.opts.ssl)) {
        factory = this.getServer();
      } else {
        factory = https.createServer(this.opts.ssl, this.getServer());
      }

      this.listener = factory.listen(port, hostname, backlog, (err, result) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(result);
      });
    });
  }

  /**
   * Uncaught Exception
   *
   * Listens for an uncaught exception.
   * Uncaught exceptions in Express need
   * to receive 4 arguments, even though
   * you might not need all of them.
   *
   * We're calling our received function
   * like this to decouple the Steeplejack
   * requirement from the Express logic.
   * This means that a Steeplejack application
   * doesn't need to remember to call their
   * uncaughtException method with four
   * arguments.
   *
   * Notice that the order in the use function
   * is different to the function that is
   * invoked (Express returns err first,
   * Steeplejack requires err to be third).
   *
   * @param {function} fn
   * @returns {Express}
   */
  uncaughtException (fn) {
    return this.use((err, req, res, next) => fn(req, res, err, next));
  }

  /**
   * Use
   *
   * Exposes the use method. This is to
   * add middleware function to the stack
   *
   * @param {*[]} arguments
   * @returns {Express}
   */
  use () {
    const server = this.getServer();

    server.use(...arguments);

    return this;
  }
}

/* Export */
exports.default = () => ({
  expressLib,
  Express,
});

exports.inject = {
  name: 'steeplejack-express',
};
