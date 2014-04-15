var fs = require('fs');
var path = require('path');
var url = require('url');
var querystring = require('querystring');
var websocket = require('websocket-stream');
var dbg = require('debug')('fs-stream-websocket:server');

module.exports = function(wss, config) {
  var cfg = { root: process.cwd() };

  if (config) {
    for (var p in config) {
      cfg[p] = config[p];
    }
  }

  wss.on('connection', streamcon)
  return wss;

  function streamcon(ws) {
    var urlobj = url.parse(ws.upgradeReq.url);
    var filepath = path.join(cfg.root, urlobj.pathname);
    var options = querystring.parse(urlobj.query);

    dbg('recv start %s', filepath)
    dbg('  options %s', JSON.stringify(options));
    dbg('  url %s', JSON.stringify(urlobj));

    if (options.fn == 'read') {
      var out = websocket(ws);
      fs.createReadStream(filepath, options)
        .pipe(out)
        .on('end', dbg.bind(dbg, 'recv end %s', filepath));
      return;
    }

    if (options.fn == 'write') {
      var input = websocket(ws);
      var out = fs.createWriteStream(filepath, options)
      out.on('finish', dbg.bind(dbg, 'recv finish %s', filepath));
      input.pipe(out);
      return;
    }
  }
}