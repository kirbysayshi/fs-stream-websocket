
fs-stream-websocket
==================

`fs.createReadStream` and `fs.createWriteStream` over a websocket, assumedly in a browser. Uses [websocket-stream](https://github.com/maxogden/websocket-stream/) for file streaming.

This module is incomplete, and is not secure.

Usage
-----

In the client:

```js
var fs = require('fs-stream-websocket'); // gives you fs.js

// optional, defaults shown
fs.config({
  host: window.location.host,
  path: '', // Added after host as a prefix
  protocol: 'ws:'
})

// This will be streamed from the server.
fs.createReadStream('somefile.txt', 'utf8').on('data', function(chunk) {
  console.log(chunk);
});
```

On the server:

```js
var fsserver = require('fs-stream-websocket'); // gives you server.js
var http = require('http');
var server = http.createServer();
var wss = new WebSocketServer({server: server})

// optional, defaults shown
var config = {
  root: process.cwd() // directory to use for static files
}

fsserver(wss, config);
```

Tests
-----

```sh
npm test
```

Currently there is a race condition I'm trying to track down, possibly related to https://github.com/maxogden/websocket-stream/issues/33.




