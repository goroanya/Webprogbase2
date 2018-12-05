
let nameRegExpr = /^[a-zA-Z_.\d\-]+$/;

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

$('#myForm').submit(function (e) {
    let error = $('#error').html();
    if (error === "") $('#myForm').submit();
    else e.preventDefault();
});
