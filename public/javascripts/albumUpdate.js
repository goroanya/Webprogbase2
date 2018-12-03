$('#albumUpdateButton').click(function () {
    updateConfirm();
});

let nameRegExpr = /^[a-zA-Z_\d\-]+$/;

$('#album_name').on('input', function () {
    let value = $('#album_name').val();

    let test = nameRegExpr.test(value);

    if (value.length === 0) $('#error').html("Empty field!");
    else if (value.length < 3 || value.length > 15) $('#error').html("Name should contain at least 3 characters but no more than 15 characters");
    else if (!test) {
        $('#error').html("Invalid name");
    } else {
        $('#error').html("");
    }
});

function updateConfirm() {

    let modal = $("#updateModal");
    modal.modal('show');
    let value = $('#album_name').val();

    let test = nameRegExpr.test(value);


    if (test && value.length !== 0 && value.length >= 3 && value.length <= 15) {
        $('#modal-error').html("");
        $('#confirmUpdateButton').bind('click', async function () {

            let result = await fetch(`/api/v1/albums/${$('#oldName').val()}`, {
                method: "PUT",
                body: JSON.stringify({ name: $('#album_name').val() }),
                headers: {
                    "Content-Type": "application/json"
                },
            });
            result = await result.json();

            if (result.message) {
                $('#error-message').html(result.message);
            }
            else {
                $("#updateForm").attr('action', `/albums/${result.name}`);

                $("#updateForm").submit();
            }
        });
    }
    else if (value.length === 0)  $('#modal-error').html("Empty field!");
    else if (value.length < 3 || value.length > 15) $('#modal-error').html("Name should contain at least 3 characters but no more than 15 characters");
    else if (!test) {
        $('#modal-error').html("Invalid name");
    }  
};
