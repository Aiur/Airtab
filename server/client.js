var socket = io.connect('/');

socket.emit('lastUrls', {} );

function sendExplicitUrl(url) {
  socket.emit('newUrl', { url: url });
}

function sendUrl() {
  var url = $("#send_url").val();
  var urlregex = new RegExp(
        "^(http:\/\/|https:\/\/|ftp:\/\/.){1}([0-9A-Za-z]+\.)");
  if (url && urlregex.test(url)) {
    $("#errors").fadeOut();
    $("#urlControlContainer").removeClass('error');
    $("#send_url").val('');
    sendExplicitUrl(url);
  } else {
    $("#errors").text('Please enter a valid URL, the entered URL was not recognised!');
    $("#errors").fadeIn();
    $("#urlControlContainer").addClass('error');
  }
}

function keyDownHandler() {
  if (window.event.keyCode == 13) {
    sendUrl();
  }
}

socket.on('lastUrls', function(data) {
  $("#lastUrls").html('');
  if (data.urls.length == 0) {
    $("#lastUrls").html('No recent links found!');
  }
  for(var i = 0; i < data.urls.length; i++) {
    var link = data.urls[i];
    var ahref = $('<a />');
    ahref.attr('href', '');
    ahref.text(data.urls[i]);
    ahref.bind('click', (function(urlParam) {
      return function() {
        sendExplicitUrl(urlParam);
      };
    })(data.urls[i]));
    //var onclick = "onclick=\"sendExplicitUrl('" + data.urls[i] + "')\"";
    //var ahref = '<a href="?" ' + onclick + '>' + data.urls[i] + '</a>';
    var liElm = $('<li />');
    liElm.append(ahref);
    $("#lastUrls").append(liElm);
    $("#lastUrls").append("<br />");
  }
});

