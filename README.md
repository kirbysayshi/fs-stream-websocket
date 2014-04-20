
fs-stream-websocket
==================

`fs.createReadStream` and `fs.createWriteStream` over a websocket, assumedly in a browser. Uses [websocket-stream](https://github.com/maxogden/websocket-stream/) for file streaming.

This module is incomplete, and has no security or sandbox for restricting file read/writing.

[![Build Status](https://travis-ci.org/kirbysayshi/fs-stream-websocket.svg?branch=master)](https://travis-ci.org/kirbysayshi/fs-stream-websocket)

Usage
-----

In the client:

```js
var fs = require('fs-stream-websocket'); // gives you fs.js

// optional, defaults shown
fs.config({
  host: window.location.host,
  prefix: '', // Added after host as a prefix
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
  root: process.cwd() // directory to use for file root (you can get out with ..)
}

fsserver(wss, config);
```

Tests
-----

```sh
npm test
```




