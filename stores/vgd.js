var _ = require('lodash');

// v.gd is identical to is.gd but on a different domain
_.assign(exports, require('./isgd'), {
  name: 'v.gd',
  URL: 'http://v.gd'
});
