$('#sendBtn').click(async () => {
    const login = $('#author').val();
    let result = await fetch(`/api/v1/sendReaction/${login}`, {
        method: 'POST',
        body: JSON.stringify({
            reaction: $('#reaction').val(),
            picName: $('#pictureName').text()
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    });

    result = await result.json();
    console.log(result)

    if (result.message) $('#message').text( result.message );
    else $('#message').text('\'' + result.reaction + '\'' + ' sent to ' + login);
});
