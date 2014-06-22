var _ = require('lodash');
var assert = require('assert');
var crypto = require('crypto');

var Stores = require('../stores');

var CHUNK_SIZE = 8192; // 8 KiB

describe('Store', function() {
  _.forEach(Stores, function(store) {
    describe(store.name, function() {
      this.timeout(5000);

      before(function() {
        if (store.maxChunkSize && store.maxChunkSize < CHUNK_SIZE)
          this.chunk = crypto.randomBytes(store.maxChunkSize);
        else
          this.chunk = crypto.randomBytes(CHUNK_SIZE);
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
