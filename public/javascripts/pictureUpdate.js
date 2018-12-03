('#photoUpdateButton').click(function () {
    let updatedPhotoName = $('#short_name').val();

    updateConfirm(updatedPhotoName);
});

function updateConfirm(photoName) {

    let modal = $("#updateModal");
    modal.modal('show');

    $('#confirmUpdateButton').bind('click', async function () {


        let result = await fetch(`/api/v1/photos/${photoName}`, {
            method: "put",
            body: JSON.stringify({
                name: photoName,
                description: $('#description').html()
            })
        });
        if (result.message) {
            $('#error-message').html(result.message);
        }
        else {
            $("#updateForm").attr('action', `/photos/page/${result.short_name}`);
            $("updateForm").submit();
        }

    });
};