var assert = require('assert');
var crypto = require('crypto');

var png = require('../lib/png');

describe('PNG', function() {
  before(function() {
    this.data = crypto.randomBytes(8192); // 8 KiB
  });

  it('encodes', function(done) {
    var self = this;
    png.encode(self.data, function(err, data) {
      self.png = data;
      done(err);
    });
  });

  it('decodes', function(done) {
    var self = this;
    png.decode(self.png, self.data.length, function(err, data) {
      if (err) return done(err);
      assert.deepEqual(data, self.data);
      done();
    });
  });
});
