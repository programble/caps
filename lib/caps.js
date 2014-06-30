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
    stores.push(chunkStores[0]);
    Array.prototype.unshift.apply(stores, chunkStores.slice(1));

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
};

exports.download = function(options, done) {
  options    = options || {};
  var data   = options.data;
  var stores = options.stores;
  var log    = options.log;

  var expectedChecksum, version = data.shift();
  // Backwards compatibility for when there was no version
  if (_.isArray(version)) {
    expectedChecksum = version;
    version = 1;
  } else {
    expectedChecksum = data.shift();
  }

  if (version != exports.VERSION)
    return done(new Error('Incompatible version'));

  // Calculate widths of fields for log formatting
  var chunkNW = ('' + data.length).length;
  var chunkLW = ('' + _.max(data, 0)[0]).length;
  var storeIW = ('' + _.max(_.filter(stores), 'id').id).length;
  var storeNW = _(stores).filter().pluck('name').max('length').value().length;

  // Download each chunk in parallel, trying redundancies in series
  async.mapLimit(data, stores.length, function(chunkData, nextChunk) {
    var chunkN = data.indexOf(chunkData);
    var chunkSize = chunkData.shift();
    async.eachSeries(chunkData, function(storeData, nextStore) {
      var logLine = [
        'get',
        'chunk #' + justify.right(chunkN, chunkNW, '0') + '/' + data.length,
        '(' + justify.right(chunkSize, chunkLW, '0') + ')',
        'store #' + justify.right(storeData[0], storeIW, '0')
      ];

      var store = _(stores).filter().find({ id: storeData[0] });

      logLine.push(
        justify.left('(' + (store ? store.name : 'missing') + ')', storeNW + 2),
        '<-',
        JSON.stringify(storeData[1])
      );
      log.apply(this, logLine);

      if (!store) return nextStore();

      store.get(storeData[1], chunkSize, function(err, buf) {
        // Try the next redundant store if an error occurs
        if (buf && buf.length != chunkSize)
          err = new Error('chunk size mismatch');
        if (err) {
          log(err.stack);
          return nextStore();
        }

        logLine.pop(); logLine.pop();
        log.apply(this, logLine);

        // Move to next chunk on success
        nextChunk(null, buf);
      });
    }, function(err) {
      // Only called if all redundant stores fail
      nextChunk(err || new Error('missing chunk'));
    });
  }, function(err, chunks) {
    if (err) return done(err);

    // Reconstruct original buf and verify checksum
    var buf = Buffer.concat(chunks);
    var actualChecksum = checksum(buf);
    if (_.isEqual(actualChecksum, expectedChecksum))
      done(null, buf);
    else
      done(new Error('checksum mismatch'));
  });
};
