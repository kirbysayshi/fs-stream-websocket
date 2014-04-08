var test = require('tape');
var http = require('http');
var WebSocketServer = require('ws').Server;
var concat = require('concat-stream');
var fs = require('fs');

var client = require('./fs');
var server = require('./server');

var port = 7999;

client.config({
  host: 'localhost:' + port
})

test('createReadStream emits utf8', function(t) {
  var echo = echoserver(function() {
    client
      .createReadStream('./package.json', { encoding: 'utf8' })
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

test('createWritableStream writes utf8', function(t) {

  // package.json is is piped to the server as package2.json,
  // which is then read back from the fs manually to verify.

  var echo = echoserver(function() {
    // Normally you would have a file some other way, via a browser API.
    // We're just using fs directly because we just need file data.
    var input = fs.createReadStream('./package.json', { encoding: 'utf8' });
    var out = client.createWriteStream('./package2.json', { encoding: 'utf8' });
    input.pipe(out).on('close', function() {
      fs.createReadStream('./package2.json', { encoding: 'utf8' })
        .pipe(all);
    });
  });

  var all = concat(function(data) {
    t.ok(typeof data === 'string', 'data is a string');
    t.equal(JSON.parse(data).main, 'server.js');
    echo.http.close(function() {
      // Cleanup.
      fs.unlinkSync('./package2.json');
      t.end()
    });
  });
});

function echoserver(onlisten) {
  var web = http.createServer();
  var wss = new WebSocketServer({ server: web });
  server(wss);
  web.listen(port, onlisten);
  return {
    wss: wss,
    http: web
  }
}