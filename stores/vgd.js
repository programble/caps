var _ = require('lodash');

// v.gd is identical to is.gd but on a different domain
_.assign(exports, require('./isgd'));
exports.URL = 'http://v.gd';
