var _ = require('lodash');
var assert = require('assert');

var Stores = require('../stores');

function randomBuffer(size) {
  var buf = new Buffer(size);
  for (var i = 0; i < size; i++)
    buf[i] = _.random(0, 255);
  return buf;
}

var CHUNK_SIZE = 8192; // 8 KiB

describe('Store', function() {
  _.forOwn(Stores, function(store, name) {
    describe(name, function() {
      before(function() {
        if (store.maxChunkSize && store.maxChunkSize < CHUNK_SIZE)
          this.chunk = randomBuffer(store.maxChunkSize);
        else
          this.chunk = randomBuffer(CHUNK_SIZE);
      });

      it('puts', function(done) {
        var self = this;
        store.put(self.chunk, function(err, ret) {
          self.ret = ret;
          done(err);
        });
      });

      it('gets', function(done) {
        var self = this;
        store.get(self.ret, function(err, chunk) {
          if (chunk)
            assert.deepEqual(chunk, self.chunk);
          done(err);
        });
      });
    });
  });
});
