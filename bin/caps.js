#!/usr/bin/env node

var _ = require('lodash');
var fs = require('fs');
var msgpack = require('msgpack');

var Caps = require('../lib/caps');
var Stores = require('../stores');
var Convert = require('../lib/convert');

function showHelp() {
  [
    'usage: caps upload|download|convert [options...] [file]',
    '',
    'upload options:',
    '  -b, --chunk-size=262144  maximum chunk size in bytes',
    '  -v, --vary               vary chunk size',
    '  -r, --redundancy=1       chunk upload redundancy',
    '  -s, --stores=...         comma-separated list of stores to use',
    '  -x, --exclude=...        comma-separated list of stores to exclude',
    '',
    'convert options:',
    '  -i, --input=base64       format of input (see -f)',
    '',
    'common options:',
    '  -o, --output=-           output to file',
    '  -f, --format=base64      format of data: json, msgpack, base64, png',
    '',
    'general options:',
    '  -q, --quiet              suppress logging',
    '  -h, --help               show help',
    '',
    'stores:'
  ].map(function(l) { console.error(l); });
  Stores.map(function(store) {
    if (store) console.error('  ' + store.name);
  });
  process.exit();
}

var argv = require('minimist')(process.argv.slice(2));
if (argv.h || argv.help) showHelp();

var action = argv._.shift();
if (!action) showHelp();
action = action[0];
if (action != 'u' && action != 'd' && action != 'c') showHelp();

var file = argv._.shift() || '-';

function readInput(done) {
  if (file == '-') {
    var chunks = [];
    process.stdin.on('data', function(chunk) {
      chunks.push(chunk);
    });
    process.stdin.on('end', function() {
      done(null, Buffer.concat(chunks));
    });
  } else {
    fs.readFile(file, done);
  }
}

var output = argv.o || argv.output || '-';

function writeOutput(buf) {
  if (output == '-') {
    log();
    process.stdout.write(buf);
  } else {
    fs.writeFileSync(output, buf);
  }
}

var format = argv.f || argv.format || 'base64';
if (!_.contains(Convert.FORMATS, format)) {
  console.error('error: invalid format');
  process.exit(1);
}

function log() {
  if (!argv.q && !argv.quiet)
    console.error.apply(console, arguments);
}

if (action == 'u') {
  var chunkSize = argv.b || argv['chunk-size'] || 262144;
  if (!_.isNumber(chunkSize)) {
    console.error('error: chunk size must be an integer');
    process.exit(1);
  }

  var vary = argv.v || argv.vary;

  var redundancy = argv.r || argv.redundancy || 1;
  if (!_.isNumber(redundancy)) {
    console.error('error: redundancy must be an integer');
    process.exit(1);
  }

  var storeNames = argv.s || argv.stores;
  if (storeNames) storeNames = storeNames.split(',');

  var excludeNames = argv.x || argv.exclude;
  if (excludeNames) excludeNames = excludeNames.split(',');

  var stores = _.filter(Stores, function(store) {
    if (!store) return false;
    if (excludeNames && _.contains(excludeNames, store.name)) return false;
    if (storeNames && !_.contains(storeNames, store.name)) return false;
    if (store.disabled) return false;
    return true;
  });
  if (!stores.length) {
    console.error('error: no available stores');
  }

  readInput(function(err, buf) {
    if (err) throw err;
    Caps.upload({
      buf: buf,
      chunkSize: chunkSize,
      redundancy: redundancy,
      stores: stores,
      vary: vary,
      log: log
    }, function(err, data) {
      if (err) throw err;
      Convert.to(format, data, function(err, dataBuf) {
        if (err) throw err;
        writeOutput(dataBuf);
      });
    });
  });
} else if (action == 'd') {
  readInput(function(err, data) {
    if (err) throw err;
    Convert.from(format, data, function(err, data) {
      if (err) throw err;
      Caps.download({
        data: data,
        stores: Stores,
        log: log
      }, function(err, buf) {
        if (err) throw err;
        writeOutput(buf);
      });
    })
  });
} else if (action == 'c') {
  var inputFormat = argv.i || argv.input || 'base64';
  if (!_.contains(Convert.FORMATS, inputFormat)) {
    console.error('error: invalid input format');
    process.exit(1);
  }

  readInput(function(err, inputData) {
    if (err) throw err;
    Convert.from(inputFormat, inputData, function(err, interData) {
      if (err) throw err;
      Convert.to(format, interData, function(err, outputData) {
        if (err) throw err;
        writeOutput(outputData);
      });
    });
  });
}
