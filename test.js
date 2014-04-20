var test = require('tape');
var http = require('http');
var WebSocketServer = require('ws').Server;
var concat = require('concat-stream');
var fs = require('fs');
var querystring = require('querystring');
var url = require('url');

var client = require('./fs');
var server = require('./server');

var port = 7999;

client.config({
  host: 'localhost:' + port
})

test('create[Read|Write]Stream transmits __filename __dirname if globally present', function(t) {

  t.plan(3);

  global.__filename = __filename;
  global.__dirname = __dirname;

  var echo = echoserver(function() {
    client
      .createReadStream('./package.json', { encoding: 'utf8' })
      .pipe(concat(function(data) {
        // sink.
      }))
  });

  echo.wss.on('connection', function(ws) {
    var urlobj = url.parse(ws.upgradeReq.url);
    var options = querystring.parse(urlobj.query);

    t.equal(options.__filename, __filename);
    t.equal(options.__dirname, __dirname);
    t.end();
  })

  t.test('cleanup', function(t) {
    delete global.__filename;
    delete global.__dirname;
    echo.http.close(t.end);
  })

});

test('createReadStream emits utf8', function(t) {
  var echo = echoserver(function() {
    client
      .createReadStream('package.json', { encoding: 'utf8' })
      .pipe(all)
  });

  var all = concat(function(data) {
    t.ok(typeof data === 'string', 'data is a string');
    t.equal(JSON.parse(data).main, 'server.js');
    echo.http.close(t.end);
  });
});

test('createReadStream emits Buffers', function(t) {
  var echo = echoserver(function() {
    client
      .createReadStream('./package.json')
      .pipe(all)
  });

  var all = concat(function(data) {
    t.ok(Buffer.isBuffer(data), 'data is a Buffer');
    t.equal(JSON.parse(data.toString('utf8')).main, 'server.js');
    echo.http.close(t.end);
  });
});

test('createWriteStream writes utf8', function(t) {

  // package.json is is piped to the server as temp.json,
  // which is then read back from the fs manually to verify.

  var all = concat(function(data) {
    t.ok(typeof data === 'string', 'data is a string');
    t.equal(JSON.parse(data).main, 'server.js');
    echo.http.close(function() {
      // Cleanup.
      fs.unlinkSync('./temp.json');
      t.end()
    });
  });

  var echo = echoserver(function() {
    // Normally you would have a file some other way, via a browser API.
    // We're just using fs directly because we just need file data.
    var input = fs.createReadStream('./package.json', { encoding: 'utf8' });
    var out = client.createWriteStream('./temp.json', { encoding: 'utf8' });

    out.on('end', function() {
      // There does not _appear_ to be a way to know when the server has
      // actually finished writing the file, since the websocket connection
      // is closed in tandem with the writeStream coming in. In other words,
      // when the local writeStream finishes, then websocket-stream
      // automatically closes the connection without funneling any events
      // back to the client. The local stream finishes because it flushes
      // its data to the underlying system, and thus causes the connection to
      // be closed.
      setTimeout(function() {
        fs.createReadStream('./temp.json', { encoding: 'utf8' })
            .pipe(all);
      }, 500)
    });

    input.pipe(out)
  });
});

function echoserver(onlisten) {
  var web = http.createServer();
  var wss = new WebSocketServer({ server: web });
  wss.on('error', console.error.bind(console, 'wss error'));
  server(wss);
  web.listen(port, onlisten);
  return {
    wss: wss,
    http: web
  }
}