var _ = require('lodash');
var async = require('async');
var crypto = require('crypto');

function checksum(buf) {
  var hash = crypto.createHash('sha1');
  hash.write(buf);
  hash.end();
  return hash.read().toJSON();
}

exports.VERSION = 1;

exports.upload = function(buf, chunkSize, redundancy, stores, log, done) {
  var chunks = [];
  for (var offset = 0; offset < buf.length; offset += chunkSize)
    chunks.push(buf.slice(offset, offset + chunkSize));

  async.mapLimit(chunks, stores.length, function(chunk, nextChunk) {
    async.timesSeries(redundancy, function(n, nextStore) {
      var store = stores.shift();
      log('put', chunk.length, store.id, store.name);
      store.put(chunk, function(err, data) {
        nextStore(err, [ store.id, data ]);
      });
      stores.push(store);
    }, function(err, data) {
      (data || []).unshift(chunk.length);
      nextChunk(err, data);
    });
  }, function(err, data) {
    if (err) return done(err);
    data.unshift(checksum(buf));
    data.unshift(exports.VERSION);
    done(null, data);
  });
};

exports.download = function(data, stores, log, done) {
  var expectedChecksum, version = data.shift();
  if (_.isArray(version)) {
    expectedChecksum = version;
    version = 1;
  } else {
    expectedChecksum = data.shift();
  }
  // TODO: Compare version
  async.mapLimit(data, stores.length, function(chunkData, nextChunk) {
    var chunkSize = chunkData.shift();
    // TODO: Take advantage of redundancy
    var storeData = chunkData.shift();
    var store = _(stores).filter().find({ id: storeData[0] });
    if (!store) return nextChunk(new Error('missing store ' + storeData[0]));
    log('get', chunkSize, store.id, store.name);
    store.get(storeData[1], chunkSize, nextChunk);
  }, function(err, chunks) {
    if (err) return done(err);
    var buf = Buffer.concat(chunks);
    var actualChecksum = checksum(buf);
    if (_.isEqual(actualChecksum, expectedChecksum))
      done(null, buf);
    else
      done(new Error('checksum mismatch'));
  });
};
