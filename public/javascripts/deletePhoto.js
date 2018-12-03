$('#photoDeleteButton').click(function () {
    let photoName = $('#pictureName').html();
    deleteConfirm(photoName);
});

function deleteConfirm(photoName) {

    let modal = $("#deleteModal");
    modal.modal('show');

    $('#confirmDeleteButton').bind('click', async function () {

        await fetch(`/api/v1/photos/${photoName}`, { method: "DELETE" });
        $("deleteForm").submit();

    });
};