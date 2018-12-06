$('#photoDeleteButton').click(function () {
    deleteConfirm();
});

function deleteConfirm() {

    let modal = $("#deleteModal");
    modal.modal('show');

    let id = $('#pictureId').val();

    $('#confirmDeleteButton').bind('click', async function () {

        await fetch(`/api/v1/photos/${id}`, { method: "DELETE" });
        $("#deleteForm").submit();

    });
};