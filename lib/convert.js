var msgpack = require('msgpack');

var PNG = require('./png');

module.exports = {
  FORMATS: [ 'json', 'msgpack', 'base64', 'png' ],

  to: function(format, data, done) {
    if (format == 'json')
      done(null, new Buffer(JSON.stringify(data)));
    else if (format == 'msgpack')
      done(null, msgpack.pack(data));
    else if (format == 'base64')
      done(null, msgpack.pack(data).toString('base64'));
    else if (format == 'png')
      PNG.encode(msgpack.pack(data), done);
    else
      done(new Error('invalid format'));
  },

  from: function(format, data, done) {
    if (format == 'json')
      done(null, JSON.parse(data.toString()));
    else if (format == 'msgpack')
      done(null, msgpack.unpack(data));
    else if (format == 'base64')
      done(null, msgpack.unpack(new Buffer(data.toString(), 'base64')));
    else if (format == 'png')
      PNG.decode(data, data.length, function(err, decoded) {
        done(err, err || msgpack.unpack(decoded));
      });
    else
      done(new Error('invalid format'));
  }
};
