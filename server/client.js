
$(document).ready(function() {
    $.ajax({
        url: '/lasturls',
        success: function(data) {
            $("#lastUrls").html('');
            for(var i = 0; i < data.urls.length; i++) {
                $("#lastUrls").append(data.urls[i]);
                $("#lastUrls").append('<br />');
            }
        }
    });
});

