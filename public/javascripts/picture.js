$('#photoUpdateButton').click(async function () {
    let name = $('#pictureName').html();
    let result = await fetch(`/api/v1/photos/${name}`);
    result = await result.json();

    if (result.message) {
        console.log("AAAAAAA hacked!!!!");
        let form = document.createElement('form');
        //todo
        form.setAttribute('action', `/error?message=${result.message}`);
        form.setAttribute('method', `get`);
        document.body.appendChild(form);
        form.submit();
    }
    else {
    }

});
