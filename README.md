# Steeplejack Express

[Express](http://expressjs.com) strategy for [Steeplejack](http://getsteeplejack.com)

# Usage

In your [Steeplejack](http://getsteeplejack.com) bootstrapping, you'll need to import this Express plugin into the
`modules` section:

### app.js

```javascript
const Steeplejack = require('steeplejack');
const express = require('@steeplejack/express');

/* Bootstrap the Steeplejack app */
const app = Steeplejack.app({
  config: {},
  modules: [
    `${__dirname}/!(node_modules|routes)/**/*.js`,
    express,
  ],
  routesDir: `${__dirname}/routes`,
});

app.run(['server'], server => server);
```

Now you've done that, you can create the server with the Express strategy:

### server.js

```javascript
exports.default = (Server, config, { Express }) => {
  const express = new Express();

  return new Server(config.server, express);
};

exports.inject = {
  name: 'server',
  deps: [
    'steeplejack-server',
    '$config',
    'steeplejack-express',
  ],
};
```

The `steeplejack-express` dependency exposes two elements, `Express` (the strategy) and `expressLib` (the express 
library).

# License

MIT License
