var io = require('socket.io').listen(8090);

var lastUrls = []

io.sockets.on('connection', function (socket) {
  socket.on('newUrl', function (data) {
    console.log(data);
    io.sockets.emit('newUrl', data);
    if (lastUrls.length > 9) lastUrls.length = 9;
    lastUrls.push(data.url);
  });
  socket.on('lastUrls', function(data) {
    console.log('lastURL request');
    socket.emit('lastUrls', { urls: lastUrls });
  });
});

