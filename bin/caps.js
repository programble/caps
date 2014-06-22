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
    '  -b, --chunk-size=131072  maximum chunk size in bytes',
    '  -r, --redundancy=1       chunk upload redundancy',
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
    '  -h, --help               show help'
  ].map(function(l) { console.error(l); });
  process.exit();
}

var argv = require('minimist')(process.argv.slice(2));
if (argv.h || argv.help) showHelp();

var action = argv._.shift();
if (!action) showHelp();
action = action[0];
if (action != 'u' && action != 'd' && action != 'c') showHelp();

var file = argv._.shift() || '-';

var output = argv.o || argv.output || '-';

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
} else if (action == 'd') {
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
} else if (action == 'c') {
  var inputFormat = argv.i || argv.input || 'base64';
  if (!_.contains(Convert.FORMATS, inputFormat)) {
    console.error('error: invalid input format');
    process.exit(1);
  }

  // TODO: Factor out
  if (file == '-') {
    var chunks = [];
    process.stdin.on('data', function(chunk) {
      chunks.push(chunk);
    });
    process.stdin.on('end', function() {
      convertInput(null, Buffer.concat(chunks));
    });
  } else {
    fs.readFile(file, convertInput);
  }

  function convertInput(err, inputData) {
    if (err) throw err;
    Convert.from(inputFormat, inputData, function(err, interData) {
      if (err) throw err;
      Convert.to(format, interData, function(err, outputData) {
        if (err) throw err;
        // TODO: Factor out
        if (output == '-')
          process.stdout.write(outputData);
        else
          fs.writeFileSync(output, outputData);
      });
    });
  }
}
