var express = require("express");
var app = express.createServer();
var io = require('socket.io').listen(app);
var openurl = require('openurl').open;

app.listen(8090);
app.use(express.bodyParser());

var URLCOUNT = 10
var lastUrls = []

// open the URL and store it in the history
function openUrl(url) {
  var index = lastUrls.indexOf(url);
  if (index > -1) {
    lastUrls.splice(index, 1);
  }

  lastUrls.unshift(url);
  while (lastUrls.length > URLCOUNT) {
    lastUrls.pop();
  }

  openurl(url);
  io.sockets.emit('lastUrls', {urls: lastUrls});
}


app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});
app.get('/jquery.js', function(req, res) {
  res.sendfile(__dirname + '/jquery-1.7.2.js');
});
app.get('/client.js', function(req, res) {
  res.sendfile(__dirname + '/client.js');
});

io.sockets.on('connection', function (socket) {
  socket.on('newUrl', function (data) {
    console.log(data);
    openUrl(data.url);
  });
  socket.on('lastUrls', function(data) {
    console.log('lastURL request');
    socket.emit('lastUrls', { urls: lastUrls });
  });
});

