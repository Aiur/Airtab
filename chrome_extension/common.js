airtab = {};

airtab.host = function(host) {
  if (typeof(host) === 'undefined') {
    var host = localStorage['host'] || '';
    host.replace('/$', '');
    return host;
  } else {
    host = host || '';
    localStorage['host'] = host;
  }
}

/*
 * Test connecting to the server.
 * @param callback - 
 *    called with { "succeed": false, message: textStatus } when failed
 *    called with { "succeed": true } when succeeded
 */
airtab.test = function(callback) {
  var x = $.ajax({
    url: airtab.host() + '/test', 
    dataType: 'jsonp',
    timeout: 4000,
    error: function(jqXHR, textStatus) {
        callback({ 
          succeed: false,
          message: textStatus
        });
      },
    success: function(data, textStatus, jqXHR){
        callback({ 
          succeed: true,
          message: textStatus
        });
      }
  });
}

