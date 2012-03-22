var socket = io.connect('/');

socket.emit('lastUrls', {} );

function sendExplicitUrl(url) {
  socket.emit('newUrl', { url: url });
}

function sendUrl() {
  var url = $("#send_url").val();
  alert("url is " + url);
  //TODO do some validation
  if (url) {
    sendExplicitUrl(url);
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

