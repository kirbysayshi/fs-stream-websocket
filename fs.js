var path = require('path');
var querystring = require('querystring');
var websocket = require('websocket-stream');
var through = require('through');
var Buffer = require('buffer').Buffer; // Included for explicit Browserify support.

// These will be set to their actual defaults lazily to prevent
// premature access of browser-specific APIs, like window.location.
var CONFIG = {};
var defaults = {
  host: function() { return window.location.host },
  prefix: function() { return '' },
  protocol: function() { return 'ws:' }
}

exports.config = function(config) {

  if (config) {
    for (var p in config) {
      CONFIG[p] = config[p];
    }
  }

  Object.keys(defaults).forEach(function(p) {
    if (!CONFIG[p]) CONFIG[p] = defaults[p]();
  })

  return CONFIG;
}

exports.createReadStream = function(filepath, options) {
  var wsurl = urlForFile(filepath, 'read', options);
  var ws = websocket(wsurl);
  return ws.pipe(through(bufferCheck));

  function bufferCheck(chunk) {
    // If chunk is an ArrayBuffer, this means no encoding was specified,
    // so websocket-stream just passed it along raw, which for websockets
    // is an ArrayBuffer. Since this is a bit of a node shim, ensure it's
    // a Buffer.
    if (chunk instanceof ArrayBuffer) {
      chunk = new Buffer(new Uint8Array(chunk));
    }

    this.queue(chunk);
  }
}

exports.createWriteStream = function(filepath, options) {
  var wsurl = urlForFile(filepath, 'write', options);
  var ws = websocket(wsurl);
  var input = through();
  input.pipe(ws);
  return input;
}

function urlForFile(filepath, op, options) {
  var opts = compatOptions(options);
  var cfg = exports.config();
  opts.fn = op;

  var wsurl = cfg.protocol + '//' + path.join(cfg.host, filepath)
    + '?'
    + querystring.stringify(opts);

  return wsurl;
}

function compatOptions(opts) {
  var options;
  if (typeof opts === 'string') {
    options = { encoding: opts };
  } else if (opts) {
    options = opts;
  } else {
    options = {};
  }

  return options;
}