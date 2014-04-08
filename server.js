var fs = require('fs');
var path = require('path');
var url = require('url');
var querystring = require('querystring');
var websocket = require('websocket-stream');

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

    console.log('STREAM BEGIN', options, filepath);

    if (options.fn == 'read') {
      var out = websocket(ws);
      fs.createReadStream(filepath, options)
        .pipe(out)
        .on('end', console.log.bind(console, 'STREAM END', options, filepath));
      return;
    }

    if (options.fn == 'write') {
      var input = websocket(ws);
      var out = fs.createWriteStream(filepath, options)
        .on('finish', console.log.bind(console, 'STREAM END', options, filepath));
      input.pipe(out);
      return;
    }
  }
}