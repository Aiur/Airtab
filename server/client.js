var socket = io.connect('/');

socket.emit('lastUrls', {} );

function sendExplicitUrl(url) {
  socket.emit('newUrl', { url: url });
}

function resetErrors() {
    $("#errors").fadeOut();
    $("#urlControlContainer").removeClass('error');
}

function sendUrl() {
  var url = $("#send_url").val();
  var urlregex = new RegExp(
        "^(http:\/\/|https:\/\/|ftp:\/\/.){1}([0-9A-Za-z]+\.)");
  if (url && urlregex.test(url)) {
    resetErrors();
    $("#send_url").val('');
    sendExplicitUrl(url);
  } else {
    $("#errors").text('Please enter a valid URL, the entered URL was not recognised!');
    $("#errors").fadeIn();
    $("#urlControlContainer").addClass('error');
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
    ahref.addClass('localLink');
    ahref.attr('href', link);
    ahref.attr('target', '_blank');
    var textLink = link;
    if (textLink.length > 100) {
      textLink = textLink.substring(0, 90) + " [...]";
    }
    ahref.text(textLink);
    //var onclick = "onclick=\"sendExplicitUrl('" + data.urls[i] + "')\"";
    //var ahref = '<a href="?" ' + onclick + '>' + data.urls[i] + '</a>';
    var liElm = $('<div />');

    var serverBtn = $('<a />');
    serverBtn.addClass('btn')
    serverBtn.addClass('leftButton')
    serverBtn.attr('href', '')
    serverBtn.bind('click', (function(urlParam) {
      return function() {
        sendExplicitUrl(urlParam);
        return false;
      };
    })(link));
    serverBtn.text('Send Again');

    liElm.append(serverBtn);
    liElm.append(ahref);
    $("#lastUrls").append(liElm);
  }
});

$(document).ready(function() {
  $("#send_url").focus();
  $("#send_url").keydown(resetErrors);
});
