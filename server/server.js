var express = require("express");
var app = express.createServer();
var io = require('socket.io').listen(app, { log: false });
var exec = require("child_process").exec;
var spawn = require("child_process").spawn;

app.listen(8090);
// bootstrap
app.use('/bootstrap', express.static(__dirname + '/bootstrap'));
app.use('/chrome_app', express.static(__dirname + '/chrome_app'));
app.use('/screenshots', express.static(__dirname + '/screenshots'));
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
    if (process.platform=='win32') {
      escapeChars = "^<>?{}&";
      for(var i = 0; i < escapeChars.length; i++) {
        url = url.replace(escapeChars[i], "^" + escapeChars[i]);
      }
      
      execStr = "explorer.exe ^\"" + url;
      console.log("Exec on windows: " + execStr);
      exec(execStr);
    } else {
      require("openurl").open(url);c
    }
  } catch (err) {
    console.log('Unable to open url: ' + url);
  }

  io.sockets.emit('lastUrls', { urls: lastUrls });
}


// Start our child process which interacts with mouse+keyboard
proc = spawn("AirTabInputServer.exe");

// Output handling from server app
output = ""
outputHandlers = []

proc.stdout.on('data', function(data) {
  data = data.toString();
  if (data.indexOf("==") == 0) {
    output = data;
  } else {
    output += data;
  }
  
  if (output.indexOf("<><>") >= 0) {
    for(var i = 0; i < outputHandlers.length; i++) {
      outputHandlers[i](output);
    }
    output = "";
  }
});

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});
app.get('/jquery.js', function(req, res) {
  res.sendfile(__dirname + '/jquery-1.7.2.js');
});
app.get('/jquery.mousewheel.js', function(req, res) {
  res.sendfile(__dirname + '/jquery.mousewheel.js');
});
app.get('/client.js', function(req, res) {
  res.sendfile(__dirname + '/client.js');
});
app.get('/remote.html', function(req, res) {
  res.sendfile(__dirname + '/remote.html');
});
app.get('/debug.html', function(req, res) {
  res.sendfile(__dirname + '/debug.html');
});
app.get('/test.html', function(req, res) {
  res.sendfile(__dirname + '/test.html');
});
app.post('/newUrl', function(req, res) {
  console.log('NewUrl Posted: ' + req.body.url)
  openUrl(req.body.url);
  res.send({'status': 'ok'});
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
  socket.on("mousemove", function(data) {
    proc.stdin.write("mm " + data.pX + " " + data.pY + "\r\n");
    //console.log(data);
  });
  socket.on("mousemoveRelative", function(data) {
    proc.stdin.write("mmr " + data.dX + " " + data.dY + "\r\n");
    console.log(data);
  });
  socket.on("mouseup", function(data) {
    if (!data.noPosition) {
      proc.stdin.write("mm " + data.pX + " " + data.pY + "\r\n");
    }
    proc.stdin.write("mu " + data.btn[0] + "\r\n");
    //console.log(data);
  });
  socket.on("mousedown", function(data) {
    if (!data.noPosition) {
      proc.stdin.write("mm " + data.pX + " " + data.pY + "\r\n");
    }
    proc.stdin.write("md " + data.btn[0] + "\r\n");
    //console.log(data);
  });
  socket.on("keydown", function(data) {
    proc.stdin.write("kd " + data.keyCode + "\r\n");
  });
  socket.on("keyup", function(data) {
    proc.stdin.write("ku " + data.keyCode + "\r\n");
  });
  socket.on("disconnect", function(data) {
    proc.stdin.write("clear\r\n");
  });
  socket.on("clear", function() {
    proc.stdin.write("clear\r\n");
  });
  socket.on("scrollY", function(data) {
    //console.log("scrollY " + data);
    proc.stdin.write("sy " + data + "\r\n");
  });
  socket.on("scrollX", function(data) {
    //console.log("scrollX " + data);
    proc.stdin.write("sx " + data + "\r\n");
  });
  socket.on("screenshot", function(data) {
    proc.stdin.write("ss screenshots " + data.width + " " + data.height + "\r\n");
    function myHandler(output) {
      if(output.indexOf("==screenshot==" >= 0)) {
        var parts = output.split("\r\n");
        socket.emit("screenshot", {url: "/" + parts[1].replace("\\", "/") });
        outputHandlers.splice(outputHandlers.indexOf(myHandler), 1);
      }
    }
    outputHandlers.push(myHandler);
  });
  socket.on("debugInputServer", function() {
    proc.stdin.write("debug\r\n");
    function myHandler(output) {
      if(output.indexOf("==debug==" >= 0)) {
        socket.emit("debugInputServer", { text: output });
        outputHandlers.splice(outputHandlers.indexOf(myHandler), 1);
      }
    }
    outputHandlers.push(myHandler);
  });
});

