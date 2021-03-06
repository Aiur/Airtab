var express = require("express");
var app = express.createServer();
var io = require('socket.io').listen(app, { log: false });
var exec = require("child_process").exec;
var spawn = require("child_process").spawn;

// set cwd=script path
process.chdir(__dirname);

app.listen(8090);
// bootstrap
app.use('/bootstrap', express.static(__dirname + '/bootstrap'));
app.use('/chrome_app', express.static(__dirname + '/chrome_app'));
app.use('/', express.static(__dirname + '/'));
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
    if (process.platform == 'win32') {
      escapeChars = "^<>?{}&";
      for(var i = 0; i < escapeChars.length; i++) {
        url = url.replace(escapeChars[i], "^" + escapeChars[i]);
      }
      
      execStr = "explorer.exe ^\"" + url;
      console.log("Exec on windows: " + execStr);
      exec(execStr);
    } else {
      require("openurl").open(url);
    }
  } catch (err) {
    console.log('Unable to open url: ' + url);
  }

  io.sockets.emit('lastUrls', { urls: lastUrls });
}

var LINE_ENDING = "\r\n";
// Start our child process which interacts with mouse+keyboard
if (process.platform == 'win32') {
  proc = spawn("AirTabInputServer.exe");
} else if (process.platform == 'darwin') {
  proc = spawn("./AirtabOSXInputServer");
  LINE_ENDING = "\n";
} else {
  // Other platforms not supported. Mock it up so we can test the server.
  proc = {};
  proc.stdin = {}; 
  proc.stdout = {};
  proc.stdin.write = function() {console.log(arguments)};
  proc.stdout.on = function() {};
}

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

// Test that the server is running.
app.get('/test', function(req, res) {
  var data = {"success": true};
  if (req.query["callback"]) {
    data = req.query["callback"] + "(" + JSON.stringify(data) + ")";
  }
  res.send(data);
});

app.post('/newUrl', function(req, res) {
  console.log('NewUrl Posted: ' + req.body.url)
  openUrl(req.body.url);
  res.send({'status': 'ok'});
});

var setSSDir = false;

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
    // console.log(data);
    proc.stdin.write("mm " + data.pX + " " + data.pY + LINE_ENDING);
  });
  socket.on("mousemoveRelative", function(data) {
    proc.stdin.write("mmr " + data.dX + " " + data.dY + LINE_ENDING);
    // console.log(data);
  });
  socket.on("mouseup", function(data) {
    if (!data.noPosition) {
      proc.stdin.write("mm " + data.pX + " " + data.pY + LINE_ENDING);
    }
    proc.stdin.write("mu " + data.btn[0] + LINE_ENDING);
    //console.log(data);
  });
  socket.on("mousedown", function(data) {
    if (!data.noPosition) {
      proc.stdin.write("mm " + data.pX + " " + data.pY + LINE_ENDING);
    }
    proc.stdin.write("md " + data.btn[0] + LINE_ENDING);
    //console.log(data);
  });
  socket.on("keydown", function(data) {
    proc.stdin.write("kd " + data.keyCode + LINE_ENDING);
  });
  socket.on("keyup", function(data) {
    proc.stdin.write("ku " + data.keyCode + LINE_ENDING);
  });
  socket.on("disconnect", function(data) {
    proc.stdin.write("clear" + LINE_ENDING);
  });
  socket.on("clear", function() {
    proc.stdin.write("clear" + LINE_ENDING);
  });
  socket.on("scrollY", function(data) {
    //console.log("scrollY " + data);
    proc.stdin.write("sy " + data + LINE_ENDING);
  });
  socket.on("scrollX", function(data) {
    //console.log("scrollX " + data);
    proc.stdin.write("sx " + data + LINE_ENDING);
  });
  socket.on("screenshot", function(data) {
    proc.stdin.write("ss screenshots " + data.width + " " + data.height + LINE_ENDING);
    function myHandler(output) {
      if(output.indexOf("==screenshot==" >= 0)) {
        var parts = output.split(LINE_ENDING);
        
        if (parts[1] == "FAILED" || parts[2] == "FAILED") {
          socket.emit("screenshot", {url: "/failed.png" });
        } else {
          // the screenshot command returns the absolute path it set up
          // we convert it here to a URL
          if (!setSSDir) {
            app.use('/screenshots', express.static(parts[1]));
            setSSDir = true;
          }

          socket.emit("screenshot", {url: "/screenshots/" + parts[2] });
        }
        
        outputHandlers.splice(outputHandlers.indexOf(myHandler), 1);
      }
    }
    outputHandlers.push(myHandler);
  });
  socket.on("debugInputServer", function() {
    proc.stdin.write("debug" + LINE_ENDING);
    function myHandler(output) {
      if(output.indexOf("==debug==" >= 0)) {
        socket.emit("debugInputServer", { text: output });
        outputHandlers.splice(outputHandlers.indexOf(myHandler), 1);
      }
    }
    outputHandlers.push(myHandler);
  });
});

