$(document).ready(function() {

    var session = "1298053109"

    $("#form-submit").on("submit", function(e) {
        e.preventDefault();

        textEndpoint = location.protocol + "//" + location.host + "/lakki/stuff"

        var textarea = $('textarea#taskInput');
        var text = textarea.val();
        console.log(text);
        $.ajax({
            type: "POST",
            url: textEndpoint,
            data: {
                "input": text,
                "session": session
            },
            beforeSend: function(xhr) {
                textarea.val('');
                $("#returned").empty();
                $("<p>loading...</p>").appendTo("#returned");
                console.log(text);
            }

        }).done(function(data) {
            console.log(JSON.stringify(data));
            $("#returned").empty();
            $("<p>" + data["queryResult"]["fulfillmentText"] + "</p>").appendTo("#returned");
        });
    });
});
