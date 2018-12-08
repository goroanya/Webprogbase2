$('#userUpdateButton').click(function () {
    updateConfirm();
});

const fullnameRegExpr = /[A-Za-zа-яёА-ЯЁ\s]+$/;


$('#inputFullname').on('input', function () {
    let value = $('#inputFullname').val();

    let test = fullnameRegExpr.test(value);

    if (value.length === 0) $('#error').html("");
    else if (!test) {
        $('#error').html("Invalid fullname");
    } else {
        $('#error').html("");
    }
});

function updateConfirm() {

    let modal = $("#updateModal");
    modal.modal('show');

    let value = $('#inputFullname').val();

    let test = fullnameRegExpr.test(value);

    if (value.length === 0 || test) {
        $('#modal-error').html("");

        $('#confirmUpdateButton').bind('click', () => {
            $("#updateForm").submit();
        });
    }
    else $('#modal-error').html("Invalid fullname");

};
