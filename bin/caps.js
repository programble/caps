#!/usr/bin/env node

var _ = require('lodash');
var fs = require('fs');
var msgpack = require('msgpack');

var Caps = require('../lib/caps');
var Stores = require('../stores');

function showHelp() {
  [
    'usage: caps upload|download [options...] <file|data>',
    '',
    'upload options:',
    '  -b, --chunk-size=bytes   maximum chunk size in bytes (default: 8192)',
    '  -r, --redundancy=n       chunk upload redundancy (default: 1)',
    '',
    'download options:',
    '  -o, --output=file        output to file (default: stdout)',
    '',
    'general options:',
    '  -q, --quiet              suppress logging',
    '  -h, --help               show help'
  ].map(function(l) { console.error(l); });
  process.exit();
}

var argv = require('minimist')(process.argv.slice(2));
if (argv.h || argv.help) showHelp();

var action = argv._.shift();
if (!action) showHelp();
action = action[0];
if (action != 'u' && action != 'd') showHelp();

if (!argv._[0]) showHelp();

function log() {
  if (!argv.q && !argv.quiet)
    console.error.apply(console, arguments);
}

if (action == 'u') {
  var file = argv._.shift();

  var chunkSize = argv.b || argv['chunk-size'] || 8192;
  if (!_.isNumber(chunkSize)) {
    console.error('error: chunk size must be an integer');
    process.exit(1);
  }
  var redundancy = argv.r || argv.redundancy || 1;
  if (!_.isNumber(redundancy)) {
    console.error('error: redundancy must be an integer');
    process.exit(1);
  }

  var stores = _.reject(Stores, function(store) {
    if (store && store.maxChunkSize)
      return store.maxChunkSize < chunkSize;
    return !store;
  });
  if (!stores.length) {
    console.error('error: no available stores');
  }

  var buf = fs.readFileSync(file);

  Caps.upload(buf, chunkSize, redundancy, stores, log, function(err, data) {
    if (err) throw err;
    console.log(msgpack.pack(data).toString('base64'));
  });
} else {
  var data = msgpack.unpack(new Buffer(argv._.shift(), 'base64'));

  var outputFile = argv.o || argv.output;

  Caps.download(data, Stores, log, function(err, buf) {
    if (err) throw err;
    if (outputFile)
      fs.writeFileSync(outputFile, buf);
    else
      console.log(buf.toString());
  });
}
