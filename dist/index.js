'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./react-async-hook.cjs.production.min.js');
} else {
  module.exports = require('./react-async-hook.cjs.development.js');
}
