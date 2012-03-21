var io = require('socket.io').listen(8090);

io.sockets.on('connection', function (socket) {
  socket.on('newUrl', function (data) {
    console.log(data);
    io.sockets.emit('newUrl', data);
  });

});

