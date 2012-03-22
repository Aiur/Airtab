var socket = io.connect('/');

socket.emit('lastUrls', {} );

function sendExplicitUrl(url) {
  socket.emit('newUrl', { url: url });
}

function sendUrl() {
  var url = $("#send_url").val();
  var urlregex = new RegExp(
        "^(http:\/\/www.|https:\/\/www.|ftp:\/\/www.|www.){1}([0-9A-Za-z]+\.)");
  if (url && urlregex.test(url)) {
    sendExplicitUrl(url);
    $("#errors").fadeOut();
  } else {
    $("#errors").text('Please enter a valid URL, the entered URL was not recognised!');
    $("#errors").fadeIn();
  }
}

socket.on('lastUrls', function(data) {
  $("#lastUrls").html('');
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
    $("#lastUrls").append(ahref);
    $("#lastUrls").append("<br />");
  }
});

