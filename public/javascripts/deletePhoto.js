$('#photoDeleteButton').click(function () {
    deleteConfirm();
});

function deleteConfirm() {

    let modal = $("#deleteModal");
    modal.modal('show');

    let photoName = $('#pictureName').html();
    
    $('#confirmDeleteButton').bind('click', async function () {

        await fetch(`/api/v1/photos/${photoName}`, { method: "DELETE" });
        $("#deleteForm").submit();

    });
};