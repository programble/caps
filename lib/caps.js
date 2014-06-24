var _ = require('lodash');
var async = require('async');
var crypto = require('crypto');

var justify = require('./justify');

function checksum(buf) {
  var hash = crypto.createHash('sha1');
  hash.write(buf);
  hash.end();
  return hash.read().toJSON();
}

exports.VERSION = 1;

exports.upload = function(options, done) {
  options        = options || {};
  var buf        = options.buf;
  var chunkSize  = options.chunkSize;
  var vary       = options.vary;
  var redundancy = options.redundancy;
  var stores     = options.stores;
  var log        = options.log;

  // If chunkSize is constant, only use stores capable of storing chunkSize
  if (!vary)
    stores = _.reject(stores, function(store) {
      return store.maxChunkSize < chunkSize;
    });

  // Split buf into chunks of at most chunkSize and assign stores.
  var chunks = [];
  for (var offset = 0; offset < buf.length; offset += chunks[0].length) {
    // Rotate stores array
    var chunkStores = stores.splice(0, redundancy);
    Array.prototype.push.apply(stores, chunkStores);

    // Use the largest chunk size that every store is capable of, or chunkSize
    var minSize = _(chunkStores)
      .pluck('maxChunkSize')
      .filter()
      .tap(function(sizes) { sizes.push(chunkSize); })
      .min()
      .value();

    var chunk = buf.slice(offset, offset + minSize);
    chunk.stores = chunkStores;
    chunks.unshift(chunk);
  }
  // Put the chunks back in order
  chunks = chunks.reverse();

  // Calculate widths of fields for log formatting
  var chunkNW = ('' + chunks.length).length;
  var chunkLW = ('' + _.max(chunks, 'length').length).length;
  var storeIW = ('' + _.max(stores, 'id').id).length;
  var storeNW = _(stores).pluck('name').max('length').value().length;

  // Upload each chunk in parallel, to each store in series
  async.mapLimit(chunks, stores.length, function(chunk, nextChunk) {
    var chunkN = chunks.indexOf(chunk);
    async.mapSeries(chunk.stores, function(store, nextStore) {
      var logLine = [
        'put',
        'chunk #' + justify.right(chunkN, chunkNW, '0') + '/' + chunks.length,
        '(' + justify.right(chunk.length, chunkLW, '0') + ')',
        'store #' + justify.right(store.id, storeIW, '0'),
        justify.left('(' + store.name + ')', storeNW + 2)
      ];
      log.apply(this, logLine);

      store.put(chunk, function(err, data) {
        logLine.push('->')
        logLine.push(JSON.stringify(data));
        log.apply(this, logLine);

        // Prepend store ID to data
        nextStore(err, [ store.id, data ]);
      });
    }, function(err, data) {
      // Prepend chunk length to data
      nextChunk(err, [ chunk.length ].concat(data));
    });
  }, function(err, data) {
    if (err) return done(err);
    // Prepend version and checksum to data
    data.unshift(checksum(buf));
    data.unshift(exports.VERSION);
    done(null, data);
  });
}

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
    async.eachSeries(chunkData, function(storeData, nextStore) {
      var store = _(stores).filter().find({ id: storeData[0] });
      if (!store) {
        log('missing store', storeData[0]);
        return nextStore();
      }
      // TODO: Better logging
      log('get', chunkSize, store.id, store.name);
      store.get(storeData[1], chunkSize, function(err, buf) {
        if (err) {
          log('warning:', store.id, store.name, err);
          return nextStore();
        }
        if (buf.length != chunkSize) {
          log('warning:', store.id, store.name, 'chunk size mismatch');
          return nextStore();
        }
        nextChunk(null, buf);
      });
    }, function(err) {
      nextChunk(err || new Error('could not get chunk from any stores'));
    });
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

