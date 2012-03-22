var express = require("express");
var app = express.createServer();
var io = require('socket.io').listen(app);
var openurl = require('openurl').open;

app.listen(8090);
// bootstrap
app.use('/bootstrap', express.static(__dirname + '/bootstrap'));
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

  try {
    openurl(url);
  } catch (err) {
    console.log('Unable to open url: ' + url);
  }
}


app.post('/newUrl', function(req, res) {
  openUrl(req.body.url);
});
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});
app.get('/jquery.js', function(req, res) {
  res.sendfile(__dirname + '/jquery-1.7.2.js');
});
app.get('/client.js', function(req, res) {
  res.sendfile(__dirname + '/client.js');
});
app.post('/newUrl', function(req, res) {
  openUrl(req.body.url);
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

