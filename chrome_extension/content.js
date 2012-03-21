console.log('hello2');
    var tab = chrome.tabs.getCurrent(function(tab) {
            console.log('hello');                                                     
                  var socket = io.connect('http://192.168.1.8:8090');
                        console.log('2');
                              socket.on('connect', function() {
                                      console.log('3');
                                              socket.emit('newUrl', tab.url);
                                                    });
                                  });
