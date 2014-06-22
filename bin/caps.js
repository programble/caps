#!/usr/bin/env node

var _ = require('lodash');
var fs = require('fs');
var msgpack = require('msgpack');

var Caps = require('../lib/caps');
var Stores = require('../stores');
var Convert = require('../lib/convert');

function showHelp() {
  [
    'usage: caps upload|download [options...] [file]',
    '',
    'upload options:',
    '  -b, --chunk-size=131072  maximum chunk size in bytes',
    '  -r, --redundancy=1       chunk upload redundancy',
    '',
    'common options:',
    '  -o, --output=-           output to file',
    '  -f, --format=base64      format of data: json, msgpack, base64, png',
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

var output = argv.o || argv.output || '-';

var format = argv.f || argv.format || 'base64';
if (format != 'json' &&
    format != 'msgpack' &&
    format != 'base64' &&
    format != 'png') {
  console.error('error: invalid format');
  process.exit(1);
}

function log() {
  if (!argv.q && !argv.quiet)
    console.error.apply(console, arguments);
}

if (action == 'u') {
  var file = argv._.shift() || '-';

  var chunkSize = argv.b || argv['chunk-size'] || 131072;
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

  if (file == '-') {
    var chunks = [];
    process.stdin.on('data', function(chunk) {
      chunks.push(chunk);
    });
    process.stdin.on('end', function() {
      upload(null, Buffer.concat(chunks));
    });
  } else {
    fs.readFile(file, upload);
  }

  function upload(err, buf) {
    if (err) throw err;
    Caps.upload(buf, chunkSize, redundancy, stores, log, function(err, data) {
      if (err) throw err;
      Convert.to(format, data, function(err, dataBuf) {
        if (err) throw err;
        if (output == '-')
          process.stdout.write(dataBuf);
        else
          fs.writeFileSync(output, dataBuf);
      });
    });
  }
} else {
  var file = argv._.shift() || '-';

  if (file == '-') {
    var chunks = [];
    process.stdin.on('data', function(chunk) {
      chunks.push(chunk);
    });
    process.stdin.on('end', function() {
      parseData(null, Buffer.concat(chunks));
    });
  } else {
    fs.readFile(file, parseData);
  }

  function parseData(err, data) {
    if (err) throw err;
    Convert.from(format, data, function(err, data) {
      if (err) throw err;
      Caps.download(data, Stores, log, function(err, buf) {
        if (err) throw err;
        if (output == '-')
          process.stdout.write(buf);
        else
          fs.writeFileSync(output, buf);
      });
    })
  }
}
